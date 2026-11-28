package com.academy.service.payment;

import com.academy.entity.Course;
import com.academy.entity.Ebook;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.EbookStatus;
import com.academy.entity.enums.PaymentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.service.CouponService;
import com.academy.service.EbookService;
import com.academy.service.EnrollmentService;
import com.academy.service.MasterclassBookingService;
import com.academy.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Checks a purchase and records it as a PENDING order, whatever the payment
 * method (CMI card or PayPal). The server decides the price; the gateway only
 * collects it. Settlement goes through PaymentService.processPaymentCallback.
 */
@Service
@RequiredArgsConstructor
public class CheckoutOrderService {

    public static final String METHOD_CMI    = "Carte bancaire (CMI)";
    public static final String METHOD_PAYPAL = "PayPal";

    private final PaymentTransactionRepository transactionRepository;
    private final CourseRepository            courseRepository;
    private final EnrollmentService           enrollmentService;
    private final CouponService               couponService;
    private final SettingsService             settingsService;
    private final EbookService                ebookService;
    private final MasterclassBookingService   masterclassBookingService;

    @Value("${app.subscription.currency}") private String subscriptionCurrency; // MAD

    // ── Subscription ─────────────────────────────────────────────────────────

    @Transactional
    public PaymentTransaction prepareSubscription(String planId, String couponCode, User user, String paymentMethod) {
        if (user.hasActiveSubscription()) {
            throw new BadRequestException("You already have an active subscription");
        }

        // Resolve plan
        String planPrefix;
        BigDecimal price;
        if ("monthly".equalsIgnoreCase(planId)) {
            planPrefix = "SUB-MON";
            price      = settingsService.getMonthlyPrice();
        } else {
            planPrefix = "SUB-YEA";
            // Offer price only inside its window (server clock); normal price otherwise.
            price      = settingsService.getEffectiveYearlyPrice();
        }

        // Coupons don't stack on a running offer (its price is already applied).
        if (couponCode != null && !couponCode.isBlank()
                && "yearly".equalsIgnoreCase(planId) && settingsService.getActiveYearlyPromo().isPresent()) {
            throw new BadRequestException("Coupons can't be combined with the current offer: the offer price is already applied.");
        }

        // Apply coupon (monthly or yearly)
        price = discounted(couponCode, user, price, "SUBSCRIPTION");

        String orderId = planPrefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)   // stores the CMI oid
                .transactionType("SUBSCRIPTION")
                .amount(price)
                .currency(subscriptionCurrency)
                .status(PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .couponCode(couponCode != null && !couponCode.isBlank() ? couponCode.trim().toUpperCase() : null)
                .build()
        );

        return txn;
    }

    // ── Course purchase initiation ────────────────────────────────────────────

    @Transactional
    public PaymentTransaction prepareCourse(UUID courseId, User user, String paymentMethod) {
        return prepareCourse(courseId, user, paymentMethod, null);
    }

    @Transactional
    public PaymentTransaction prepareCourse(UUID courseId, User user, String paymentMethod, String couponCode) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // Only approved (published) courses can be bought.
        if (course.getStatus() != com.academy.entity.enums.CourseStatus.PUBLISHED) {
            throw new BadRequestException("This course is not available for purchase");
        }
        if (!course.getRequiresPurchase()) {
            throw new BadRequestException("This course does not require purchase");
        }
        if (enrollmentService.isUserEnrolled(user, course)) {
            throw new BadRequestException("You already have access to this course");
        }

        // LIVE masterclass: lock the course row, then check price / date / seats.
        // The PENDING transaction saved below holds a seat for a limited time, so
        // concurrent buyers can never outnumber the places left.
        boolean liveMasterclass = masterclassBookingService.isLiveMasterclass(course);
        if (liveMasterclass) {
            course = masterclassBookingService.lockCourse(courseId);
            masterclassBookingService.assertCanStartCardPayment(course, user);
        }

        BigDecimal price = discounted(couponCode, user, course.getPrice(), "COURSE");
        String orderId = "CRS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("COURSE_PURCHASE")
                .referenceId(courseId)
                .amount(price)
                .currency("MAD")
                .couponCode(couponOf(couponCode))
                .status(PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .expiresAt(liveMasterclass
                        ? LocalDateTime.now().plusMinutes(MasterclassBookingService.SEAT_HOLD_MINUTES)
                        : LocalDateTime.now().plusHours(1))
                .build()
        );

        if (liveMasterclass) {
            // Displayed availability now includes this hold.
            masterclassBookingService.evictCourseCachesAfterCommit();
        }

        return txn;
    }

    /**
     * Prepare an ebook order.
     *
     * Deliberately performs no subscription check: an ebook is a one-off purchase
     * that any signed-in student can make, with or without a plan.
     */
    @Transactional
    public PaymentTransaction prepareEbook(UUID ebookId, User user, String paymentMethod) {
        return prepareEbook(ebookId, user, paymentMethod, null);
    }

    @Transactional
    public PaymentTransaction prepareEbook(UUID ebookId, User user, String paymentMethod, String couponCode) {
        Ebook ebook = ebookService.findById(ebookId);

        if (ebook.getStatus() != EbookStatus.PUBLISHED) {
            throw new BadRequestException("This ebook is not available for purchase");
        }
        if (ebookService.userOwns(user, ebook)) {
            throw new BadRequestException("You already own this ebook");
        }

        BigDecimal price = discounted(couponCode, user, ebook.getPrice(), "EBOOK");
        String orderId = "EBK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("EBOOK_PURCHASE")
                .referenceId(ebookId)
                .amount(price)
                .currency("MAD")
                .couponCode(couponOf(couponCode))
                .status(PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build()
        );

        return txn;
    }

    /** Price after the coupon (if any). A full discount can't be charged by card or PayPal. */
    private BigDecimal discounted(String couponCode, User user, BigDecimal price, String target) {
        if (couponCode == null || couponCode.isBlank()) return price;
        BigDecimal p = couponService.applyCoupon(couponCode, user, price, target);
        if (p.signum() <= 0) {
            // A payment of 0.00 is refused by the gateways; full-discount access is
            // granted by an admin instead.
            throw new BadRequestException("This coupon covers the full price — please contact support to get access.");
        }
        return p;
    }

    private static String couponOf(String couponCode) {
        return couponCode != null && !couponCode.isBlank() ? couponCode.trim().toUpperCase() : null;
    }
}
