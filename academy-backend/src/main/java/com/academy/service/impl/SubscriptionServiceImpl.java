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
import com.academy.service.SettingsService;
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
import java.util.Optional;
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
    private final SettingsService settingsService;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;

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
                        .price(settingsService.getMonthlyPrice())
                        .currency(currency)
                        .billingPeriod("monthly")
                        .features(baseFeatures)
                        .isPopular(false)
                        .build(),
                SubscriptionPlanResponse.builder()
                        .planId("yearly")
                        .name("Annual")
                        .description("Best value — includes all Masterclasses + coupon eligible")
                        .price(settingsService.getYearlyPrice())
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
            case "monthly" -> new PlanMeta("SUB-MON", settingsService.getMonthlyPrice(), "Monthly Subscription — SARALÖWE Academy");
            default        -> new PlanMeta("SUB-YEA", settingsService.getYearlyPrice(),  "Annual Subscription — SARALÖWE Academy");
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
                .couponCode(couponCode != null && !couponCode.isBlank() ? couponCode.trim().toUpperCase() : null)
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

        // Priority: ACTIVE → CANCELLED (still has access until period end) → most recent anything
        // This ensures a broken/stale record created after a valid ACTIVE one is never shown.
        Optional<Subscription> subscription =
                subscriptionRepository.findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
                .or(() -> subscriptionRepository.findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.CANCELLED))
                .or(() -> subscriptionRepository.findTopByUserOrderByCreatedAtDesc(user));

        return subscription.map(SubscriptionResponse::fromEntity).orElse(null);
    }

    @Override
    @Transactional
    public void cancelSubscription() {
        User user = getCurrentUser();

        // findTop…: older data may hold two ACTIVE rows; a plain Optional finder would throw.
        Subscription subscription = subscriptionRepository
                .findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
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

        // Cancelling only sets cancelAtPeriodEnd on the ACTIVE subscription (its status
        // stays ACTIVE until the period ends), so that is what "undo cancel" looks for.
        // A legacy CANCELLED row is still accepted.
        Subscription subscription = subscriptionRepository
                .findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
                .filter(s -> Boolean.TRUE.equals(s.getCancelAtPeriodEnd()))
                .or(() -> subscriptionRepository.findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.CANCELLED))
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

        // Plan type from the orderId prefix encoded during checkout
        boolean monthly = orderId.startsWith("SUB-MON");
        Subscription subscription = grantSubscriptionTime(user, monthly ? "MONTHLY" : "YEARLY",
                monthly ? 1 : 0, monthly ? 0 : 1,
                transaction.getAmount(), transaction.getCurrency(), payzoneTransactionId);

        // The coupon is consumed only now that the payment has succeeded.
        couponService.recordUsage(transaction.getCouponCode(), user);

        emailService.sendSubscriptionConfirmation(user);

        log.info("Subscription activated for user: {} until {}", user.getEmail(), subscription.getCurrentPeriodEnd());
    }

    /**
     * Adds a paid (or admin-granted) period to a user's subscription.
     *
     * If the user still has an active subscription, the new period starts when the
     * current one ends and the existing ACTIVE row is extended — so a renewal paid
     * early (online or by bank transfer), or a second checkout paid by mistake,
     * adds time instead of being lost, and there is only ever one ACTIVE row.
     * Otherwise a new subscription starts now.
     */
    private Subscription grantSubscriptionTime(User user, String planType, int months, int years,
                                               BigDecimal amount, String txnCurrency, String paymentRef) {
        LocalDateTime now = LocalDateTime.now();
        Optional<Subscription> current = subscriptionRepository
                .findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
                .filter(s -> s.getCurrentPeriodEnd() != null && s.getCurrentPeriodEnd().isAfter(now));

        LocalDateTime from = current.map(Subscription::getCurrentPeriodEnd).orElse(now);
        if (user.getSubscriptionEndDate() != null && user.getSubscriptionEndDate().isAfter(from)) {
            from = user.getSubscriptionEndDate();
        }
        LocalDateTime periodEnd = from.plusYears(years).plusMonths(months);

        Subscription subscription;
        if (current.isPresent()) {
            subscription = current.get();
            subscription.setCurrentPeriodEnd(periodEnd);
            subscription.setNextBillingDate(periodEnd);
            subscription.setLastPaymentAt(now);
            subscription.setCancelAtPeriodEnd(false);
            subscription.setCancelledAt(null);
            if ("YEARLY".equals(planType)) subscription.setPlanType("YEARLY");
            if (paymentRef != null) subscription.setPayzoneTransactionId(paymentRef);
        } else {
            subscription = Subscription.builder()
                    .user(user)
                    .payzoneTransactionId(paymentRef)
                    .planType(planType)
                    .status(SubscriptionStatus.ACTIVE)
                    .currentPeriodStart(now)
                    .currentPeriodEnd(periodEnd)
                    .amount(amount)
                    .currency(txnCurrency)
                    .lastPaymentAt(now)
                    .nextBillingDate(periodEnd)
                    .build();
        }
        subscription = subscriptionRepository.save(subscription);

        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        if (current.isEmpty()) user.setSubscriptionStartDate(now);
        user.setSubscriptionEndDate(periodEnd);
        userRepository.save(user);

        enrollmentService.enrollUserInAllBeginnerCourses(user);
        return subscription;
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
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();

        List<UUID> ids = subscriptionRepository.findExpiredActiveSubscriptions(now).stream()
                .map(Subscription::getId).toList();

        // One transaction per subscription: a single bad row no longer rolls back the
        // whole nightly run (which used to leave every expired user with free access).
        org.springframework.transaction.support.TransactionTemplate tx =
                new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        int failed = 0;
        for (UUID id : ids) {
            try {
                tx.executeWithoutResult(status -> expireOne(id, now));
            } catch (Exception e) {
                failed++;
                log.error("Could not expire subscription {}: {}", id, e.getMessage(), e);
            }
        }
        log.info("Processed {} expired subscriptions ({} failed)", ids.size(), failed);
    }

    private void expireOne(UUID subscriptionId, LocalDateTime now) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId).orElse(null);
        if (subscription == null || subscription.getStatus() != SubscriptionStatus.ACTIVE) return;
        {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);

            User user = subscription.getUser();

            // The user may have renewed (online, or an admin-recorded bank transfer)
            // after this period ended but before tonight's run: only this old row
            // expires — the user keeps access while their own end date is ahead.
            boolean stillCovered = user.getSubscriptionEndDate() != null
                    && user.getSubscriptionEndDate().isAfter(now);
            boolean otherActive = subscriptionRepository
                    .findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
                    .filter(s -> !s.getId().equals(subscription.getId()))
                    .filter(s -> s.getCurrentPeriodEnd() != null && s.getCurrentPeriodEnd().isAfter(now))
                    .isPresent();
            if (stillCovered || otherActive) {
                log.info("Old subscription row expired; user {} keeps access until {}",
                        user.getEmail(), user.getSubscriptionEndDate());
                return;
            }

            user.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            userRepository.save(user);

            enrollmentService.deactivateSubscriptionEnrollments(user);

            org.hibernate.Hibernate.initialize(user); // the e-mail is sent on an @Async thread
            emailService.sendSubscriptionExpired(user);

            log.info("Subscription expired for user: {}", user.getEmail());
        }
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
            // Load the user here: the e-mail is sent on an @Async thread, which must
            // not initialise a lazy proxy from this transaction's session.
            org.hibernate.Hibernate.initialize(subscription.getUser());
            emailService.sendSubscriptionExpiryReminder(subscription.getUser(), daysLeft);
        }

        log.info("Sent {} subscription expiry reminders", expiringSubscriptions.size());
    }

    @Override
    @Transactional
    public SubscriptionResponse adminActivateSubscription(UUID userId) {
        User user = userService.findById(userId);

        // Used for bank-transfer payments. A user who is still active gets one
        // more year after their current end date (early renewal); otherwise a
        // new year starts today.
        boolean renewal = user.hasActiveSubscription();
        Subscription subscription = grantSubscriptionTime(user, "YEARLY", 0, 1,
                settingsService.getYearlyPrice(), currency, null);

        log.info("Admin {} yearly subscription for user: {} until {}",
                renewal ? "extended" : "activated", user.getEmail(), subscription.getCurrentPeriodEnd());
        return SubscriptionResponse.fromEntity(subscription);
    }

    @Override
    @Transactional
    public void revokeForRefund(User user) {
        LocalDateTime now = LocalDateTime.now();
        subscriptionRepository.findTopByUserAndStatusOrderByCreatedAtDesc(user, SubscriptionStatus.ACTIVE)
                .ifPresent(s -> {
                    s.setStatus(SubscriptionStatus.EXPIRED);
                    s.setCurrentPeriodEnd(now);
                    subscriptionRepository.save(s);
                });
        user.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
        user.setSubscriptionEndDate(now);
        userRepository.save(user);
        enrollmentService.deactivateSubscriptionEnrollments(user);
        log.info("Subscription revoked after refund for user {}", user.getEmail());
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
