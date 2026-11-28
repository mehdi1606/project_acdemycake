package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "idx_coupons_code", columnList = "code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    /** Percentage discount, e.g. 20 means 20% off */
    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent;

    /** Maximum total redemptions allowed (null = unlimited) */
    @Column(name = "max_uses")
    private Integer maxUses;

    /** How many times this coupon has been used */
    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /** Optional description/note for the admin */
    @Column(name = "description", length = 255)
    private String description;

    /** Where it can be used: comma-separated SUBSCRIPTION, COURSE, EBOOK. */
    @Column(name = "applies_to", nullable = false, length = 60)
    @Builder.Default
    private String appliesTo = "SUBSCRIPTION,COURSE,EBOOK";

    public boolean appliesTo(String target) {
        if (appliesTo == null || appliesTo.isBlank()) return true;
        for (String t : appliesTo.split(",")) {
            if (t.trim().equalsIgnoreCase(target)) return true;
        }
        return false;
    }
}
