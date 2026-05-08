package com.academy.service.impl;

import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.PaymentTransactionResponse;
import com.academy.entity.Course;
import com.academy.entity.CoursePurchase;
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
    private final EmailService emailService;
    private final UserService userService;
    private final PayZoneService payZoneService;

    @Override
    @Transactional
    public PaymentResponse initiateCoursePayment(UUID courseId) {
        User user = getCurrentUser();
        Course course = courseService.findById(courseId);

        // Check if course requires purchase
        if (!course.getRequiresPurchase()) {
            throw new BadRequestException("This course does not require purchase");
        }

        // Check if user already owns the course
        if (enrollmentService.isUserEnrolled(user, course)) {
            throw new BadRequestException("You already have access to this course");
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

        switch (status.toUpperCase()) {
            case "SUCCESS", "COMPLETED" -> {
                transaction.setStatus(PaymentStatus.COMPLETED);
                transaction.setPayzoneTransactionId(transactionId);
                transaction.setCompletedAt(LocalDateTime.now());
                transactionRepository.save(transaction);

                // Process based on transaction type
                if ("SUBSCRIPTION".equals(transaction.getTransactionType())) {
                    subscriptionService.processSuccessfulPayment(orderId, transactionId);
                } else if ("COURSE_PURCHASE".equals(transaction.getTransactionType())) {
                    processCoursePaymentSuccess(transaction);
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

        if (amount.compareTo(transaction.getAmount()) > 0) {
            throw new BadRequestException("Refund amount cannot exceed original transaction amount");
        }

        // Process refund via PayZone
        PaymentResponse refundResponse = payZoneService.processRefund(
                transaction.getPayzoneTransactionId(),
                amount,
                reason
        );

        transaction.setStatus(PaymentStatus.REFUNDED);
        transactionRepository.save(transaction);

        // If this was a course purchase, revoke access
        if ("COURSE_PURCHASE".equals(transaction.getTransactionType()) && transaction.getReferenceId() != null) {
            Course course = courseService.findById(transaction.getReferenceId());
            enrollmentService.revokeEnrollment(transaction.getUser(), course);
        }

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
