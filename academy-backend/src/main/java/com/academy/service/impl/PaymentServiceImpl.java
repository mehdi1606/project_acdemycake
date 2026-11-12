package com.academy.service.impl;

import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.PaymentTransactionResponse;
import com.academy.entity.Course;
import com.academy.entity.CoursePurchase;
import com.academy.entity.InstructorEarning;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.EarningSourceType;
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.integration.payzone.PayZoneService;
import com.academy.repository.CoursePurchaseRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final CoursePurchaseRepository coursePurchaseRepository;
    private final CourseService courseService;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final InstructorService instructorService;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;
    private final EbookService ebookService;
    private final EmailService emailService;
    private final UserService userService;
    private final PayZoneService payZoneService;
    private final MasterclassBookingService masterclassBookingService;
    private final com.academy.repository.UserRepository userRepository;
    private final com.academy.repository.InstructorEarningRepository instructorEarningRepository;

    @Override
    @Transactional
    public PaymentResponse initiateCoursePayment(UUID courseId) {
        User user = getCurrentUser();
        Course course = courseService.findById(courseId);

        // Check if course requires purchase
        // Only approved (published) courses can be bought.
        if (course.getStatus() != com.academy.entity.enums.CourseStatus.PUBLISHED) {
            throw new BadRequestException("This course is not available for purchase");
        }
        if (!course.getRequiresPurchase()) {
            throw new BadRequestException("This course does not require purchase");
        }

        // Check if user already owns the course
        if (enrollmentService.isUserEnrolled(user, course)) {
            throw new BadRequestException("You already have access to this course");
        }

        // Seat-limited live sessions are only sold through the CMI checkout, which
        // holds the seat and can decline capture when the session is full.
        if (masterclassBookingService.isLiveMasterclass(course)) {
            throw new BadRequestException("Live masterclasses are paid through the card checkout.");
        }

        String orderId = "CRS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("COURSE_PURCHASE")
                .referenceId(courseId)
                .amount(course.getPrice())
                .currency(course.getCurrency())
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        transaction = transactionRepository.save(transaction);

        PaymentResponse paymentResponse = payZoneService.initiatePayment(
                orderId,
                course.getPrice(),
                course.getCurrency(),
                "Course Purchase: " + course.getTitle(),
                user.getEmail()
        );

        transaction.setPaymentUrl(paymentResponse.getPaymentUrl());
        transactionRepository.save(transaction);

        log.info("Course payment initiated for user: {} - Course: {} - Order: {}",
                user.getEmail(), course.getTitle(), orderId);

        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .paymentUrl(paymentResponse.getPaymentUrl())
                .orderId(orderId)
                .amount(course.getPrice())
                .currency(course.getCurrency())
                .status(PaymentStatus.PENDING)
                .message("Payment initiated successfully")
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse initiateSubscriptionPayment() {
        // Subscriptions must go through POST /subscriptions/subscribe with an explicit planId.
        // This legacy method is kept only to satisfy the PaymentService interface; it falls back
        // to the yearly plan so that any internal caller still gets a valid response.
        return subscriptionService.subscribe("yearly", null);
    }

    @Override
    @Transactional
    public void handlePayzoneWebhook(String payload, String signature) {
        Map<String, Object> webhookData = payZoneService.parseWebhook(payload, signature);

        String event = (String) webhookData.get("event");
        String orderId = (String) webhookData.get("orderId");
        String transactionId = (String) webhookData.get("transactionId");
        String status = (String) webhookData.get("status");

        log.info("Processing PayZone webhook: event={}, orderId={}, status={}", event, orderId, status);

        switch (event) {
            case "payment.completed" -> processPaymentCallback(orderId, "SUCCESS", transactionId);
            case "payment.failed" -> processPaymentCallback(orderId, "FAILED", transactionId);
            case "payment.cancelled" -> processPaymentCallback(orderId, "CANCELLED", transactionId);
            case "refund.completed" -> {
                log.info("Refund completed for order: {}", orderId);
            }
            default -> log.warn("Unknown webhook event: {}", event);
        }
    }

    @Override
    @Transactional
    public void processPaymentCallback(String orderId, String status, String transactionId) {
        PaymentTransaction transaction = transactionRepository.findByPayzoneOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "orderId", orderId));

        if (transaction.getStatus() == PaymentStatus.COMPLETED) {
            log.warn("Transaction already completed: {}", orderId);
            return;
        }

        // Serialise everything that settles money for this user (duplicate or
        // concurrent callbacks, two checkouts paid at once), then re-read the
        // committed status: only a PENDING order can be settled. A success
        // message for a FAILED / CANCELLED / REFUNDED order (a replay) is ignored,
        // and the CMI handler then does not capture the card.
        userRepository.findByIdForUpdate(transaction.getUser().getId());
        PaymentStatus committed = transactionRepository.findStatusById(transaction.getId());
        if (committed != PaymentStatus.PENDING) {
            log.warn("Callback '{}' ignored for order {} in status {}", status, orderId, committed);
            return;
        }

        switch (status.toUpperCase()) {
            case "SUCCESS", "COMPLETED" -> {
                // ── SUBSCRIPTION ────────────────────────────────────────────────
                // processSuccessfulPayment handles the full lifecycle internally:
                //   1. Guards against duplicates (checks status itself)
                //   2. Sets transaction COMPLETED + saves
                //   3. Creates Subscription record
                //   4. Updates User subscription fields
                //   5. Sends confirmation email + enrolls in beginner courses
                //
                // DO NOT pre-save the transaction here — doing so causes
                // processSuccessfulPayment to see status=COMPLETED and return early,
                // which would silently skip subscription creation.
                if ("SUBSCRIPTION".equals(transaction.getTransactionType())) {
                    subscriptionService.processSuccessfulPayment(orderId, transactionId);

                } else if ("COURSE_PURCHASE".equals(transaction.getTransactionType())) {
                    // Load the buyer now: the confirmation e-mail is sent on an @Async
                    // thread, and a still-lazy User proxy initialised from that thread
                    // shares this Hibernate session and corrupts it (rolling back the
                    // whole confirmation).
                    org.hibernate.Hibernate.initialize(transaction.getUser());
                    // LIVE masterclass: take the seat under a row lock. If the session
                    // filled up (or this is a duplicate payment) the booking is refused,
                    // the transaction is CANCELLED and the CMI handler does not capture.
                    String refusal = checkLiveMasterclassSeat(transaction);
                    if (ALREADY_PROCESSED.equals(refusal)) {
                        log.warn("Transaction settled concurrently, skipping: {}", orderId);
                        return;
                    }
                    if (refusal != null) {
                        refuseLiveMasterclassBooking(transaction, transactionId, refusal);
                        return;
                    }
                    // Any course: a second payment for a course already bought (two
                    // checkouts open at once) is not captured.
                    Course purchased = courseService.findById(transaction.getReferenceId());
                    if (coursePurchaseRepository.existsByUserAndCourseAndStatus(
                            transaction.getUser(), purchased, PaymentStatus.COMPLETED)) {
                        refuseDuplicate(transaction, transactionId,
                                "You already own \"" + purchased.getTitle() + "\". The extra payment was not captured.");
                        return;
                    }
                    // For course purchases the lifecycle is managed here.
                    // processCoursePaymentSuccess uses the in-memory entity for
                    // transactionId, so set the fields before calling it.
                    transaction.setStatus(PaymentStatus.COMPLETED);
                    transaction.setPayzoneTransactionId(transactionId);
                    transaction.setCompletedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);
                    processCoursePaymentSuccess(transaction);

                } else if ("EBOOK_PURCHASE".equals(transaction.getTransactionType())) {
                    if (ebookService.isOwnedBy(transaction.getUser(), transaction.getReferenceId())) {
                        refuseDuplicate(transaction, transactionId,
                                "You already own this ebook. The extra payment was not captured.");
                        return;
                    }
                    // Same lifecycle as a course purchase: mark paid, then grant
                    // ownership. grantPurchase also notifies the buyer in-app.
                    transaction.setStatus(PaymentStatus.COMPLETED);
                    transaction.setPayzoneTransactionId(transactionId);
                    transaction.setCompletedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);
                    ebookService.grantPurchase(
                            transaction.getUser(),
                            transaction.getReferenceId(),
                            orderId,
                            transaction.getAmount(),
                            transaction.getCurrency()
                    );

                } else {
                    // Generic fallback for any other transaction types
                    transaction.setStatus(PaymentStatus.COMPLETED);
                    transaction.setPayzoneTransactionId(transactionId);
                    transaction.setCompletedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);
                }

                log.info("Payment completed successfully: {}", orderId);
            }
            case "FAILED" -> {
                transaction.setStatus(PaymentStatus.FAILED);
                transaction.setErrorMessage("Payment failed");
                transactionRepository.save(transaction);

                if ("SUBSCRIPTION".equals(transaction.getTransactionType())) {
                    subscriptionService.processFailedPayment(orderId, "Payment failed");
                }

                log.warn("Payment failed: {}", orderId);
            }
            case "CANCELLED" -> {
                transaction.setStatus(PaymentStatus.CANCELLED);
                transactionRepository.save(transaction);
                log.info("Payment cancelled: {}", orderId);
            }
            default -> log.warn("Unknown payment status: {} for order: {}", status, orderId);
        }
    }

    @Override
    public PageResponse<PaymentTransactionResponse> getPaymentHistory(int page, int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<PaymentTransaction> transactionsPage = transactionRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        // Batch-fetch course names for COURSE_PURCHASE transactions on this page
        List<UUID> courseIds = transactionsPage.getContent().stream()
                .filter(t -> "COURSE_PURCHASE".equals(t.getTransactionType()) && t.getReferenceId() != null)
                .map(PaymentTransaction::getReferenceId)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, String> courseNameMap = courseIds.isEmpty()
                ? Map.of()
                : courseRepository.findAllById(courseIds).stream()
                        .collect(Collectors.toMap(Course::getId, Course::getTitle));

        return PageResponse.from(transactionsPage, t -> {
            String courseName = ("COURSE_PURCHASE".equals(t.getTransactionType()) && t.getReferenceId() != null)
                    ? courseNameMap.get(t.getReferenceId())
                    : null;
            return PaymentTransactionResponse.fromEntity(t, courseName);
        });
    }

    @Override
    public PaymentTransactionResponse getTransactionById(UUID id) {
        User user = getCurrentUser();
        PaymentTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));

        // Verify ownership or admin
        if (user.getRole() != UserRole.ADMIN && !transaction.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You don't have access to this transaction");
        }

        String courseName = null;
        if ("COURSE_PURCHASE".equals(transaction.getTransactionType()) && transaction.getReferenceId() != null) {
            courseName = courseRepository.findById(transaction.getReferenceId())
                    .map(Course::getTitle)
                    .orElse(null);
        }

        return PaymentTransactionResponse.fromEntity(transaction, courseName);
    }

    /** True when a COMPLETED payment did not produce what was bought. */
    private boolean isEffectMissing(PaymentTransaction t) {
        User user = t.getUser();
        return switch (t.getTransactionType() == null ? "" : t.getTransactionType()) {
            case "SUBSCRIPTION" -> !user.hasActiveSubscription();
            case "COURSE_PURCHASE" -> courseRepository.findById(t.getReferenceId())
                    .map(c -> !coursePurchaseRepository.existsByUserAndCourseAndStatus(user, c, PaymentStatus.COMPLETED))
                    .orElse(false);
            case "EBOOK_PURCHASE" -> !ebookService.isOwnedBy(user, t.getReferenceId());
            default -> false;
        };
    }

    @Override
    @Transactional
    public void adminForceReprocessPayment(String orderId) {
        PaymentTransaction transaction = transactionRepository.findByPayzoneOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "orderId", orderId));

        String savedTxnId = transaction.getPayzoneTransactionId();

        // Only re-run orders that were really paid. A FAILED (declined), CANCELLED
        // (never captured) or REFUNDED order must not grant access; and a COMPLETED
        // order is re-run only when its effect is missing, so reprocessing can never
        // hand out a free extra year or a free course.
        PaymentStatus st = transaction.getStatus();
        if (st != PaymentStatus.PENDING && st != PaymentStatus.COMPLETED) {
            throw new BadRequestException("This payment was not successful (" + st + ") and cannot be reprocessed. "
                    + "For a bank transfer, use Users → Activate plan instead.");
        }
        if (st == PaymentStatus.COMPLETED && !isEffectMissing(transaction)) {
            throw new BadRequestException("This payment has already been applied — nothing to reprocess.");
        }

        // Reset to PENDING so the COMPLETED guards in processPaymentCallback and
        // subscriptionService.processSuccessfulPayment won't block execution.
        // This is safe here because the admin is explicitly requesting re-activation
        // of a transaction whose payment was confirmed but whose DB side-effects
        // (subscription creation, enrollment) were never applied.
        transaction.setStatus(PaymentStatus.PENDING);
        transactionRepository.save(transaction);

        log.info("Admin force-reset orderId={} to PENDING for reprocessing", orderId);

        // Run the normal success flow — now with the fix in place it will create
        // the subscription / enroll in course correctly.
        processPaymentCallback(orderId, "SUCCESS",
                savedTxnId != null ? savedTxnId : "ADMIN_MANUAL_FIX");
    }

    @Override
    @Transactional
    public void processRefund(UUID transactionId, BigDecimal amount, String reason) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin access required for refunds");
        }

        PaymentTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        if (transaction.getStatus() != PaymentStatus.COMPLETED) {
            throw new BadRequestException("Can only refund completed transactions");
        }

        if (amount == null || amount.signum() <= 0) {
            throw new BadRequestException("Refund amount must be greater than zero");
        }
        if (amount.compareTo(transaction.getAmount()) > 0) {
            throw new BadRequestException("Refund amount cannot exceed original transaction amount");
        }
        boolean fullRefund = amount.compareTo(transaction.getAmount()) == 0;

        // Money back through the gateway that took it. PayZone orders have a payment
        // URL; CMI orders are refunded in the CMI back office — here we only record it.
        if (transaction.getPaymentUrl() != null) {
            payZoneService.processRefund(transaction.getPayzoneTransactionId(), amount, reason);
        } else {
            log.info("CMI order {} — refund of {} to be issued in the CMI back office", transaction.getPayzoneOrderId(), amount);
        }

        if (!fullRefund) {
            // Partial refund (goodwill): the purchase stays valid.
            transaction.setErrorMessage("Partially refunded " + amount + " " + transaction.getCurrency() + ": " + reason);
            transactionRepository.save(transaction);
        } else {
            transaction.setStatus(PaymentStatus.REFUNDED);
            transactionRepository.save(transaction);
            revokeRefundedPurchase(transaction, amount, reason);
        }

        // The instructor's share of the refunded amount is reversed (a negative earning,
        // so it is deducted even if the original earning was already paid out).
        reverseInstructorEarnings(transaction, amount);

        // Notify user
        notificationService.createNotification(
                transaction.getUser(),
                "Refund Processed",
                "Your payment of " + amount + " " + transaction.getCurrency() + " has been refunded. Reason: " + reason,
                com.academy.entity.enums.NotificationType.PAYMENT,
                null
        );

        log.info("Refund processed: transaction={}, amount={}, reason={}",
                transactionId, amount, reason);
    }

    /** Full refund: whatever was bought stops being accessible. */
    private void revokeRefundedPurchase(PaymentTransaction transaction, BigDecimal amount, String reason) {
        User user = transaction.getUser();
        switch (transaction.getTransactionType() == null ? "" : transaction.getTransactionType()) {
            case "COURSE_PURCHASE" -> {
                Course course = courseService.findById(transaction.getReferenceId());
                enrollmentService.revokeEnrollment(user, course);
                // The purchase no longer counts (frees a live masterclass seat, allows buying again).
                coursePurchaseRepository.findByUserAndCourseAndStatus(user, course, PaymentStatus.COMPLETED)
                        .ifPresent(p -> {
                            p.setStatus(PaymentStatus.REFUNDED);
                            p.setRefundedAt(LocalDateTime.now());
                            p.setRefundAmount(amount);
                            p.setRefundReason(reason);
                            coursePurchaseRepository.save(p);
                        });
                masterclassBookingService.evictCourseCachesAfterCommit();
            }
            case "EBOOK_PURCHASE" -> ebookService.revokePurchase(user, transaction.getReferenceId());
            case "SUBSCRIPTION" -> subscriptionService.revokeForRefund(user);
            default -> { }
        }
    }

    private void reverseInstructorEarnings(PaymentTransaction transaction, BigDecimal refunded) {
        for (InstructorEarning e : instructorEarningRepository.findBySourceId(transaction.getId())) {
            if (e.getNetAmount() == null || e.getNetAmount().signum() <= 0) continue; // skip reversals
            BigDecimal share = transaction.getAmount().signum() == 0 ? BigDecimal.ZERO
                    : refunded.divide(transaction.getAmount(), 6, java.math.RoundingMode.HALF_UP);
            instructorEarningRepository.save(InstructorEarning.builder()
                    .instructor(e.getInstructor())
                    .sourceType(e.getSourceType())
                    .sourceId(e.getSourceId())
                    .courseId(e.getCourseId())
                    .amount(e.getAmount().multiply(share).negate().setScale(2, java.math.RoundingMode.HALF_UP))
                    .platformFee(e.getPlatformFee() == null ? BigDecimal.ZERO
                            : e.getPlatformFee().multiply(share).negate().setScale(2, java.math.RoundingMode.HALF_UP))
                    .netAmount(e.getNetAmount().multiply(share).negate().setScale(2, java.math.RoundingMode.HALF_UP))
                    .currency(e.getCurrency())
                    .description("Refund of order " + transaction.getPayzoneOrderId())
                    .build());
        }
    }

    /**
     * For a LIVE masterclass, locks the course row and returns the reason the
     * booking must be refused, or null when the seat can be taken. Other courses
     * always return null (unchanged behaviour).
     */
    private String checkLiveMasterclassSeat(PaymentTransaction transaction) {
        Course course = courseService.findById(transaction.getReferenceId());
        if (!masterclassBookingService.isLiveMasterclass(course)) {
            return null;
        }
        Course locked = masterclassBookingService.lockCourse(course.getId());
        // A concurrent duplicate callback for the same order may have completed it
        // while we waited for the lock: re-read the committed status.
        PaymentStatus current = transactionRepository.findStatusById(transaction.getId());
        if (current != PaymentStatus.PENDING) {
            return ALREADY_PROCESSED;
        }
        return masterclassBookingService.refusalReasonForConfirmation(locked, transaction.getUser());
    }

    /** Marks a duplicate purchase CANCELLED (the card is then not captured) and tells the buyer. */
    private void refuseDuplicate(PaymentTransaction transaction, String authCode, String message) {
        transaction.setStatus(PaymentStatus.CANCELLED);
        transaction.setPayzoneTransactionId(authCode);
        transaction.setErrorMessage("DUPLICATE: " + message);
        transactionRepository.save(transaction);
        notificationService.createNotification(transaction.getUser(), "Duplicate payment not charged",
                message, com.academy.entity.enums.NotificationType.PAYMENT, null);
        log.warn("Duplicate purchase refused — order={} reason={}", transaction.getPayzoneOrderId(), message);
    }

    /** Sentinel: the order was settled by another callback while we waited for the lock. */
    private static final String ALREADY_PROCESSED = "ALREADY_PROCESSED";

    private void refuseLiveMasterclassBooking(PaymentTransaction transaction, String authCode, String reason) {
        transaction.setStatus(PaymentStatus.CANCELLED);
        transaction.setPayzoneTransactionId(authCode);
        transaction.setErrorMessage(reason);
        transactionRepository.save(transaction);
        masterclassBookingService.evictCourseCachesAfterCommit();

        Course course = courseService.findById(transaction.getReferenceId());
        notificationService.createNotification(
                transaction.getUser(),
                "Masterclass booking not confirmed",
                reason.startsWith("DUPLICATE")
                        ? "You already have a place in " + course.getTitle() + ". The extra payment was not captured."
                        : course.getTitle() + " was fully booked before your payment completed. Your card was not charged.",
                com.academy.entity.enums.NotificationType.PAYMENT,
                "/course/course-details/" + course.getSlug()
        );
        log.warn("LIVE masterclass booking refused — order={} course={} reason={}",
                transaction.getPayzoneOrderId(), course.getId(), reason);
    }

    private void processCoursePaymentSuccess(PaymentTransaction transaction) {
        User user = transaction.getUser();
        Course course = courseService.findById(transaction.getReferenceId());

        // Idempotency guard — skip if already recorded (e.g., duplicate webhook)
        if (coursePurchaseRepository.existsByUserAndCourseAndStatus(
                user, course, com.academy.entity.enums.PaymentStatus.COMPLETED)) {
            log.warn("CoursePurchase already recorded for user={} course={} — skipping duplicate",
                    user.getEmail(), course.getTitle());
            return;
        }

        // Persist purchase record so purchase history and revenue queries work correctly
        CoursePurchase purchase = CoursePurchase.builder()
                .user(user)
                .course(course)
                .payzonePaymentIntentId(transaction.getPayzoneTransactionId())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .status(com.academy.entity.enums.PaymentStatus.COMPLETED)
                .purchasedAt(LocalDateTime.now())
                .build();
        coursePurchaseRepository.save(purchase);

        // Enroll user in course
        enrollmentService.enrollUserInCourse(user, course, true);

        // A confirmed LIVE masterclass seat changes the displayed availability.
        if (masterclassBookingService.isLiveMasterclass(course)) {
            masterclassBookingService.evictCourseCachesAfterCommit();
        }

        // Create instructor earning
        instructorService.createEarning(
                course.getInstructor().getId(),
                course.getId(),
                transaction.getId(),
                EarningSourceType.COURSE_PURCHASE,
                transaction.getAmount()
        );

        // Send email notification
        emailService.sendCoursePurchaseConfirmation(user, course);

        // Send in-app notification
        notificationService.createNotification(
                user,
                "Course Purchase Complete",
                "You now have access to: " + course.getTitle(),
                com.academy.entity.enums.NotificationType.COURSE,
                "/courses/" + course.getId()
        );

        // Notify instructor
        notificationService.createNotification(
                course.getInstructor(),
                "New Course Sale",
                user.getFullName() + " purchased your course: " + course.getTitle(),
                com.academy.entity.enums.NotificationType.PAYMENT,
                "/instructor/earnings"
        );

        log.info("Course purchase completed: user={}, course={}",
                user.getEmail(), course.getTitle());
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
