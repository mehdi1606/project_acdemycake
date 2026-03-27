package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarningsSummaryResponse {

    private BigDecimal totalEarnings;    // all-time net earnings
    private BigDecimal pendingEarnings;  // net earnings not yet paid out
    private BigDecimal monthlyEarnings;  // net earnings this calendar month
    private BigDecimal totalPaidOut;     // sum of completed payouts

    /** Last 12 months breakdown (oldest → newest) */
    private List<MonthlyBreakdown> monthlyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyBreakdown {
        private String month;       // e.g. "Jan 2025"
        private BigDecimal amount;  // net earnings that month
    }
}
