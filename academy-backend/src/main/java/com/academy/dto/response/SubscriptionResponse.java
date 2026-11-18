package com.academy.dto.response;

import com.academy.entity.Subscription;
import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private UUID id;
    private String planType;
    private SubscriptionStatus status;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private Boolean cancelAtPeriodEnd;
    private BigDecimal amount;
    private String currency;
    private Integer renewalCount;
    private LocalDateTime lastPaymentAt;
    private LocalDateTime nextBillingDate;
    private LocalDateTime createdAt;
    // Subscriber identity — only filled by fromEntityWithUser (admin listings).
    private UUID userId;
    private String userEmail;
    private String userFullName;

    /**
     * Same as {@link #fromEntity} plus the subscriber's id/email/name.
     * Must be called inside a transaction (the user association is LAZY).
     */
    public static SubscriptionResponse fromEntityWithUser(Subscription subscription) {
        SubscriptionResponse response = fromEntity(subscription);
        User user = subscription.getUser();
        if (user != null) {
            response.setUserId(user.getId());
            response.setUserEmail(user.getEmail());
            response.setUserFullName(user.getFullName());
        }
        return response;
    }

    public static SubscriptionResponse fromEntity(Subscription subscription) {
        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .planType(subscription.getPlanType())
                .status(subscription.getStatus())
                .currentPeriodStart(subscription.getCurrentPeriodStart())
                .currentPeriodEnd(subscription.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(subscription.getCancelAtPeriodEnd())
                .amount(subscription.getAmount())
                .currency(subscription.getCurrency())
                .renewalCount(subscription.getRenewalCount())
                .lastPaymentAt(subscription.getLastPaymentAt())
                .nextBillingDate(subscription.getNextBillingDate())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}
