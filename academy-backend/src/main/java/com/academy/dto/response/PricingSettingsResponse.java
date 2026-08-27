package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Current admin-editable subscription pricing. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingSettingsResponse {
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private String currency;
    /** Academy WhatsApp number for live-masterclass reservations ("" when unset). */
    private String masterclassWhatsapp;
}
