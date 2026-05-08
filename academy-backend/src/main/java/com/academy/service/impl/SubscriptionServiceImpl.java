package com.academy.service.impl;

import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.SubscriptionPlanResponse;
import com.academy.dto.response.SubscriptionResponse;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.Subscription;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.integration.payzone.PayZoneService;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.repository.SubscriptionRepository;
import com.academy.repository.UserRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CouponService;
import com.academy.service.EmailService;
import com.academy.service.EnrollmentService;
import com.academy.service.SubscriptionService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final UserService userService;
    private final EnrollmentService enrollmentService;
    private final EmailService emailService;
    private final PayZoneService payZoneService;
    private final CouponService couponService;

    @Value("${app.subscription.monthly-price}")
    private BigDecimal monthlyPrice;

    @Value("${app.subscription.yearly-price}")
    private BigDecimal yearlyPrice;

    @Value("${app.subscription.currency}")
    private String currency;

    @Override
    public List<SubscriptionPlanResponse> getSubscriptionPlans() {
        List<String> baseFeatures = Arrays.asList(
                "Access to all courses",
                "Student dashboard",
                "Course completion certificates",
                "Community forum access",
                "Messaging with instructors",
                "Progress tracking"
        );
        return Arrays.asList(
                SubscriptionPlanResponse.builder()
                        .planId("monthly")
                        .name("Monthly")
                        .description("Full access billed month to month")
                        .price(monthlyPrice)
                        .currency(currency)
                        .billingPeriod("monthly")
                        .features(baseFeatures)
                        .isPopular(false)
                        .build(),
                SubscriptionPlanResponse.builder()
                        .planId("yearly")
                        .name("Annual")
                        .description("Best value — includes all Masterclasses + coupon eligible")
                        .price(yearlyPrice)
                        .currency(currency)
                        .billingPeriod("yearly")
                        .features(baseFeatures)
                        .isPopular(true)
                        .build()
        );
    }

    /**
     * Resolve plan metadata from planId.
     * The plan prefix is encoded into the orderId so that
     * {@link #processSuccessfulPayment} can reconstruct the plan details
     * from just the orderId, without needing an extra DB column.
     */
    private record PlanMeta(String prefix, BigDecimal price, String label) {}

    private PlanMeta resolvePlan(String planId) {
        return switch (planId.toLowerCase()) {
            case "monthly" -> new PlanMeta("SUB-MON", monthlyPrice, "Monthly Subscription — SARALÖWE Academy");
            default        -> new PlanMeta("SUB-YEA", yearlyPrice,  "Annual Subscription — SARALÖWE Academy");
        };
    }

    @Override
    @Transactional
    public PaymentResponse subscribe(String planId, String couponCode) {
        User user = getCurrentUser();

        if (user.hasActiveSubscription()) {
            throw new BadRequestException("You already have an active subscription");
        }

        PlanMeta plan = resolvePlan(planId);

        // Apply coupon discount (only for yearly plan)
        BigDecimal finalPrice = plan.price();
        if (couponCode != null && !couponCode.isBlank()) {
            if (!"yearly".equalsIgnoreCase(planId)) {
                throw new BadRequestException("Coupons are only valid for the Annual plan");
            }
            finalPrice = couponService.applyCoupon(couponCode, user, plan.price());
        }

        String orderId = plan.prefix() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("SUBSCRIPTION")
                .amount(finalPrice)
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        transaction = transactionRepository.save(transaction);

        PaymentResponse paymentResponse = payZoneService.initiatePayment(
                orderId,
                finalPrice,
                currency,
                plan.label(),
                user.getEmail()
        );

        transaction.setPaymentUrl(paymentResponse.getPaymentUrl());
        transactionRepository.save(transaction);

        log.info("Subscription payment initiated for user: {} - Order: {} - Amount: {} {}",
                user.getEmail(), orderId, finalPrice, currency);

        return paymentResponse;
    }

    @Override
    public SubscriptionResponse getMySubscription() {
        User user = getCurrentUser();

        return subscriptionRepository.findTopByUserOrderByCreatedAtDesc(user)
                .map(SubscriptionResponse::fromEntity)
                .orElse(null);
    }

    @Override
    @Transactional
    public void cancelSubscription() {
        User user = getCurrentUser();

        Subscription subscription = subscriptionRepository.findByUserAndStatus(user, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));

        subscription.setCancelAtPeriodEnd(true);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        log.info("Subscription cancellation scheduled for user: {}", user.getEmail());
    }

    @Override
    public PageResponse<SubscriptionResponse> getSubscriptionHistory(int page, int size) {
        User user = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Subscription> subscriptions = subscriptionRepository.findByUser(user, pageRequest);
        return PageResponse.from(subscriptions, SubscriptionResponse::fromEntity);
    }

    @Override
    @Transactional
    public SubscriptionResponse reactivateSubscription() {
        User user = getCurrentUser();

        Subscription subscription = subscriptionRepository
                .findByUserAndStatus(user, SubscriptionStatus.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException("No cancelled subscription found"));

        if (subscription.getCurrentPeriodEnd().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Subscription has already expired. Please subscribe again.");
        }

        subscription.setCancelAtPeriodEnd(false);
        subscription.setCancelledAt(null);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription = subscriptionRepository.save(subscription);

        // Keep the User entity in sync so hasActiveSubscription() returns correctly
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        userRepository.save(user);

        log.info("Subscription reactivated for user: {}", user.getEmail());
        return SubscriptionResponse.fromEntity(subscription);
    }

    @Override
    public PageResponse<SubscriptionResponse> getAllSubscriptions(int page, int size, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Subscription> subscriptions;

        if (status != null && !status.isBlank()) {
            try {
                SubscriptionStatus subStatus = SubscriptionStatus.valueOf(status.toUpperCase());
                subscriptions = subscriptionRepository.findByStatus(subStatus, pageRequest);
            } catch (IllegalArgumentException e) {
                subscriptions = subscriptionRepository.findAll(pageRequest);
            }
        } else {
            subscriptions = subscriptionRepository.findAll(pageRequest);
        }

        return PageResponse.from(subscriptions, SubscriptionResponse::fromEntity);
    }

    @Override
    @Transactional
    public void processSuccessfulPayment(String orderId, String payzoneTransactionId) {
        PaymentTransaction transaction = transactionRepository.findByPayzoneOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (transaction.getStatus() == PaymentStatus.COMPLETED) {
            log.warn("Transaction already processed: {}", orderId);
            return;
        }

        transaction.setStatus(PaymentStatus.COMPLETED);
        transaction.setPayzoneTransactionId(payzoneTransactionId);
        transaction.setCompletedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        User user = transaction.getUser();
        LocalDateTime now = LocalDateTime.now();

        // Determine plan type and period end from the orderId prefix encoded during subscribe()
        String planType;
        LocalDateTime periodEnd;
        if (orderId.startsWith("SUB-MON")) {
            planType = "MONTHLY";
            periodEnd = now.plusMonths(1);
        } else {
            planType = "YEARLY";
            periodEnd = now.plusYears(1);
        }

        Subscription subscription = Subscription.builder()
                .user(user)
                .payzoneTransactionId(payzoneTransactionId)
                .planType(planType)
                .status(SubscriptionStatus.ACTIVE)
                .currentPeriodStart(now)
                .currentPeriodEnd(periodEnd)
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .lastPaymentAt(now)
                .nextBillingDate(periodEnd)
                .build();

        subscriptionRepository.save(subscription);

        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        user.setSubscriptionStartDate(now);
        user.setSubscriptionEndDate(periodEnd);
        userRepository.save(user);

        enrollmentService.enrollUserInAllBeginnerCourses(user);

        emailService.sendSubscriptionConfirmation(user);

        log.info("Subscription activated for user: {} until {}", user.getEmail(), periodEnd);
    }

    @Override
    @Transactional
    public void processFailedPayment(String orderId, String reason) {
        PaymentTransaction transaction = transactionRepository.findByPayzoneOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setErrorMessage(reason);
        transactionRepository.save(transaction);

        log.warn("Subscription payment failed for order: {} - Reason: {}", orderId, reason);
    }

    @Override
    @Transactional
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();

        List<Subscription> expiredSubscriptions = subscriptionRepository.findExpiredActiveSubscriptions(now);

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);

            User user = subscription.getUser();
            user.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            userRepository.save(user);

            enrollmentService.deactivateSubscriptionEnrollments(user);

            emailService.sendSubscriptionExpired(user);

            log.info("Subscription expired for user: {}", user.getEmail());
        }

        log.info("Processed {} expired subscriptions", expiredSubscriptions.size());
    }

    @Override
    @Transactional
    public void sendExpiryReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysLater = now.plusDays(7);

        List<Subscription> expiringSubscriptions = subscriptionRepository
                .findSubscriptionsExpiringBetween(now, sevenDaysLater);

        for (Subscription subscription : expiringSubscriptions) {
            int daysLeft = (int) java.time.Duration.between(now, subscription.getCurrentPeriodEnd()).toDays();
            emailService.sendSubscriptionExpiryReminder(subscription.getUser(), daysLeft);
        }

        log.info("Sent {} subscription expiry reminders", expiringSubscriptions.size());
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
