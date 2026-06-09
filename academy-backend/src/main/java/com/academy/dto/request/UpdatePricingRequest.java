package com.academy.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Admin payload to update subscription pricing. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePricingRequest {

    /** Optional — only updated when provided (the platform currently sells the annual plan). */
    @DecimalMin(value = "0.0", inclusive = false, message = "Monthly price must be greater than 0")
    private BigDecimal monthlyPrice;

    @NotNull(message = "Yearly price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Yearly price must be greater than 0")
    private BigDecimal yearlyPrice;
}
