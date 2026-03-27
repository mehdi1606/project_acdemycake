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
}
