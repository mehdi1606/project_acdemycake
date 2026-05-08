package com.academy.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateCouponRequest {

    @NotBlank(message = "Coupon code is required")
    @Size(min = 3, max = 50, message = "Code must be between 3 and 50 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code must contain only uppercase letters, numbers, dashes and underscores")
    private String code;

    @NotNull(message = "Discount percent is required")
    @DecimalMin(value = "1", message = "Discount must be at least 1%")
    @DecimalMax(value = "100", message = "Discount cannot exceed 100%")
    private BigDecimal discountPercent;

    /** Maximum total uses — null means unlimited */
    @Min(value = 1, message = "Max uses must be at least 1")
    private Integer maxUses;

    /** Optional expiry date/time */
    private LocalDateTime expiresAt;

    /** Optional description/note */
    private String description;
}
