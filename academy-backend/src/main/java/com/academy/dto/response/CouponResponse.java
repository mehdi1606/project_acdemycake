package com.academy.dto.response;

import com.academy.entity.Coupon;
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
public class CouponResponse {

    private UUID id;
    private String code;
    private BigDecimal discountPercent;
    private Integer maxUses;
    private Integer usedCount;
    private Boolean isActive;
    private LocalDateTime expiresAt;
    private String description;
    private LocalDateTime createdAt;

    public static CouponResponse fromEntity(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercent(coupon.getDiscountPercent())
                .maxUses(coupon.getMaxUses())
                .usedCount(coupon.getUsedCount())
                .isActive(coupon.getIsActive())
                .expiresAt(coupon.getExpiresAt())
                .description(coupon.getDescription())
                .createdAt(coupon.getCreatedAt())
                .build();
    }
}
