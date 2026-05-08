package com.academy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SubscribeRequest {

    /**
     * One of: "monthly" | "yearly"
     */
    @NotBlank(message = "planId is required")
    @Pattern(
        regexp = "^(monthly|yearly)$",
        message = "planId must be one of: monthly, yearly"
    )
    private String planId;

    /**
     * Optional coupon code — only valid for the "yearly" plan.
     * If provided, a discount will be applied.
     */
    private String couponCode;
}
