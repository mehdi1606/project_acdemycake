package com.academy.entity;

import com.academy.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_purchases", indexes = {
        @Index(name = "idx_course_purchases_user_id", columnList = "user_id"),
        @Index(name = "idx_course_purchases_course_id", columnList = "course_id"),
        @Index(name = "idx_course_purchases_status", columnList = "status"),
        @Index(name = "idx_course_purchases_payzone_payment_id", columnList = "payzone_payment_intent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoursePurchase extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "payzone_payment_intent_id", length = 100)
    private String payzonePaymentIntentId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "purchased_at")
    private LocalDateTime purchasedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason")
    private String refundReason;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "failure_reason")
    private String failureReason;
}
