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
public class SubscriptionPlanResponse {
    private String planId;
    private String name;
    private String description;
    private BigDecimal price;
    private String currency;
    private String billingPeriod;
    private List<String> features;
    private Boolean isPopular;

    /** Normal price (shown crossed out while an offer runs). */
    private BigDecimal regularPrice;
    /** Limited-time offer on this plan (present before and during its window). */
    private String promoId;
    private String promoTheme;
    private BigDecimal promoPrice;
    private String promoStartsAt;
    private String promoEndsAt;
    /** Server clock, so every visitor's countdown matches the price switch. */
    private String serverTime;
}
