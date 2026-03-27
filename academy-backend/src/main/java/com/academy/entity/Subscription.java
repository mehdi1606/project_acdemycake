package com.academy.entity;

import com.academy.entity.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions", indexes = {
        @Index(name = "idx_subscriptions_user_id", columnList = "user_id"),
        @Index(name = "idx_subscriptions_status", columnList = "status"),
        @Index(name = "idx_subscriptions_payzone_transaction_id", columnList = "payzone_transaction_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "payzone_transaction_id", length = 100)
    private String payzoneTransactionId;

    @Column(name = "payzone_subscription_id", length = 100)
    private String payzoneSubscriptionId;

    @Column(name = "plan_type", nullable = false, length = 50)
    @Builder.Default
    private String planType = "YEARLY";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SubscriptionStatus status;

    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    @Builder.Default
    private Boolean cancelAtPeriodEnd = false;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "renewal_count")
    @Builder.Default
    private Integer renewalCount = 0;

    @Column(name = "last_payment_at")
    private LocalDateTime lastPaymentAt;

    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;

    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE &&
                currentPeriodEnd.isAfter(LocalDateTime.now());
    }
}
