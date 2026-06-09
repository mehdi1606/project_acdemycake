package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Aggregate revenue statistics for the admin Transactions page.
 * All figures are computed dynamically from CMI {@code PaymentTransaction} rows
 * across the WHOLE dataset (not a single page), so they stay correct regardless
 * of pagination.
 *
 * Revenue = COMPLETED payments only (realised money). Pending figures are exposed
 * separately so the admin can see in-flight volume without it inflating revenue.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionStatsResponse {
    private BigDecimal totalRevenue;          // SUM(amount) where status = COMPLETED
    private BigDecimal subscriptionRevenue;   // COMPLETED + type SUBSCRIPTION
    private BigDecimal courseRevenue;         // COMPLETED + type COURSE_PURCHASE
    private BigDecimal pendingAmount;         // SUM(amount) where status = PENDING
    private long completedCount;
    private long pendingCount;
    private String currency;                  // "MAD"
}
