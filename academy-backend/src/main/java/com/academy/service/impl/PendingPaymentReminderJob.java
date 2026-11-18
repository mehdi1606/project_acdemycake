package com.academy.service.impl;

import com.academy.entity.Course;
import com.academy.entity.Ebook;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.MasterclassFormat;
import com.academy.entity.enums.PaymentStatus;
import com.academy.repository.CourseRepository;
import com.academy.repository.EbookPurchaseRepository;
import com.academy.repository.EbookRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.service.EmailService;
import com.academy.service.EnrollmentService;
import com.academy.service.MasterclassBookingService;
import com.academy.service.email.PendingPaymentInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Follows up on payments that were started but never finished (status PENDING).
 *
 * <pre>
 *   +1 h   reminder 1  "Did something go wrong?"
 *   +24 h  reminder 2  "Your order is still waiting"
 *   +48 h  reminder 3  "Last reminder: it will be cancelled"
 *   +72 h  status → CANCELLED + "Your order was cancelled" email
 * </pre>
 *
 * Cancelled quietly (no email) when reminding would make no sense: the customer
 * retried and a newer payment exists, already owns the item, or the live
 * masterclass is over or full. Payments that were PENDING before this feature
 * shipped are marked {@code reminder_count = -1} and never touched.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PendingPaymentReminderJob {

    static final Duration FIRST = Duration.ofHours(1);
    static final Duration SECOND = Duration.ofHours(24);
    static final Duration THIRD = Duration.ofHours(48);
    static final Duration CANCEL = Duration.ofHours(72);

    private final PaymentTransactionRepository transactionRepository;
    private final CourseRepository courseRepository;
    private final EbookRepository ebookRepository;
    private final EbookPurchaseRepository ebookPurchaseRepository;
    private final EnrollmentService enrollmentService;
    private final MasterclassBookingService masterclassBookingService;
    private final EmailService emailService;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.payment-reminders.enabled:true}")
    private boolean enabled;

    @Scheduled(initialDelayString = "${app.payment-reminders.initial-delay-ms:120000}",
               fixedDelayString = "${app.payment-reminders.interval-ms:900000}")
    public void run() {
        if (!enabled) return;
        List<UUID> ids = transactionRepository.findPendingIdsForReminders(LocalDateTime.now().minus(FIRST));
        for (UUID id : ids) {
            try {
                transactionTemplate.executeWithoutResult(s -> process(id));
            } catch (Exception e) {
                log.error("Payment reminder failed for transaction {}: {}", id, e.getMessage());
            }
        }
    }

    /** One transaction, row-locked so a CMI callback cannot settle it at the same moment. */
    void process(UUID id) {
        PaymentTransaction t = transactionRepository.findByIdForUpdate(id).orElse(null);
        if (t == null || t.getStatus() != PaymentStatus.PENDING) return;
        int sent = t.getReminderCount() == null ? 0 : t.getReminderCount();
        if (sent < 0) return;

        User user = t.getUser();
        Hibernate.initialize(user);
        Duration age = Duration.between(t.getCreatedAt(), LocalDateTime.now());

        Resolved item = resolve(t, user);
        if (item.info == null && item.cancelQuietly == null) {
            t.setReminderCount(-1);
            transactionRepository.save(t);
            return;
        }
        if (item.cancelQuietly != null) {
            t.setStatus(PaymentStatus.CANCELLED);
            t.setErrorMessage("Auto-cancelled: " + item.cancelQuietly);
            transactionRepository.save(t);
            log.info("Pending payment {} cancelled quietly ({})", t.getPayzoneOrderId(), item.cancelQuietly);
            return;
        }

        if (sent >= 3) {
            if (age.compareTo(CANCEL) >= 0) {
                t.setStatus(PaymentStatus.CANCELLED);
                t.setErrorMessage("Auto-cancelled: not paid after 3 reminders");
                transactionRepository.save(t);
                emailService.sendPaymentCancelled(user, item.info);
                log.info("Pending payment {} cancelled after 3 reminders", t.getPayzoneOrderId());
            }
            return;
        }

        Duration due = switch (sent) { case 0 -> FIRST; case 1 -> SECOND; default -> THIRD; };
        if (age.compareTo(due) < 0) return;

        // A customer who was offline for days gets one reminder per run, never a burst.
        t.setReminderCount(sent + 1);
        t.setLastReminderAt(LocalDateTime.now());
        transactionRepository.save(t);
        emailService.sendPaymentReminder(user, item.info, sent + 1);
        log.info("Payment reminder {} sent for {}", sent + 1, t.getPayzoneOrderId());
    }

    private record Resolved(PendingPaymentInfo info, String cancelQuietly) {}

    private Resolved resolve(PaymentTransaction t, User user) {
        String type = t.getTransactionType() == null ? "" : t.getTransactionType();
        String orderId = t.getPayzoneOrderId();

        switch (type) {
            case "SUBSCRIPTION" -> {
                if (transactionRepository.existsNewerOfType(user.getId(), t.getId(), type, t.getCreatedAt())) {
                    return new Resolved(null, "customer started a newer payment");
                }
                boolean monthly = orderId != null && orderId.startsWith("SUB-MON");
                String plan = "Premium membership (" + (monthly ? "monthly" : "yearly") + ")";
                return new Resolved(info("subscription", plan, t, "/pages/pricing-plan"), null);
            }
            case "COURSE_PURCHASE" -> {
                Course course = t.getReferenceId() == null ? null : courseRepository.findById(t.getReferenceId()).orElse(null);
                if (course == null) return new Resolved(null, "course no longer exists");
                if (transactionRepository.existsNewerForItem(user.getId(), t.getId(), type, course.getId(), t.getCreatedAt())) {
                    return new Resolved(null, "customer started a newer payment");
                }
                if (enrollmentService.isEnrolled(user, course)) return new Resolved(null, "customer already has access");
                boolean masterclass = course.getCourseType() == CourseType.MASTERCLASS;
                if (masterclass && course.getMasterclassFormat() == MasterclassFormat.LIVE) {
                    if (course.getSessionDate() != null && course.getSessionDate().isBefore(LocalDate.now())) {
                        return new Resolved(null, "masterclass date has passed");
                    }
                    Integer left = masterclassBookingService.remainingSeats(course);
                    if (left != null && left <= 0) return new Resolved(null, "masterclass is full");
                }
                return new Resolved(info(masterclass ? "masterclass" : "course", course.getTitle(), t,
                        "/course/course-details/" + course.getSlug()), null);
            }
            case "EBOOK_PURCHASE" -> {
                Ebook ebook = t.getReferenceId() == null ? null : ebookRepository.findById(t.getReferenceId()).orElse(null);
                if (ebook == null) return new Resolved(null, "ebook no longer exists");
                if (transactionRepository.existsNewerForItem(user.getId(), t.getId(), type, ebook.getId(), t.getCreatedAt())) {
                    return new Resolved(null, "customer started a newer payment");
                }
                if (ebookPurchaseRepository.existsByUserAndEbook(user, ebook)) {
                    return new Resolved(null, "customer already owns the ebook");
                }
                return new Resolved(info("ebook", ebook.getTitle(), t, "/ebooks/" + ebook.getSlug()), null);
            }
            default -> {
                // Not a type we know how to describe: leave it exactly as it is.
                return new Resolved(null, null);
            }
        }
    }

    private PendingPaymentInfo info(String kind, String title, PaymentTransaction t, String path) {
        String site = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        return new PendingPaymentInfo(kind, title, t.getAmount(), t.getCurrency(), t.getPayzoneOrderId(), site + path);
    }
}
