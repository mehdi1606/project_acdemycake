package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Admin invoices page: one page of invoices plus totals over the whole filter. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminInvoiceListResponse {

    private PageResponse<InvoiceResponse> invoices;
    private Totals totals;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Totals {
        private long count;
        private BigDecimal amountHt;
        private BigDecimal vatAmount;
        private BigDecimal amountTtc;
    }
}
