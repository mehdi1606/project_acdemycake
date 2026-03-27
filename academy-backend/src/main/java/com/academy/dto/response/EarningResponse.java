package com.academy.dto.response;

import com.academy.entity.InstructorEarning;
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
public class EarningResponse {

    private UUID id;
    private String sourceType;      // COURSE_PURCHASE | SUBSCRIPTION_SHARE
    private UUID courseId;
    private String courseName;      // resolved course title
    private BigDecimal amount;      // gross
    private BigDecimal platformFee;
    private BigDecimal netAmount;   // what instructor keeps
    private String currency;
    private String payoutStatus;    // PENDING | PAID | CANCELLED
    private String description;
    private LocalDateTime createdAt;

    public static EarningResponse fromEntity(InstructorEarning e) {
        return fromEntity(e, null);
    }

    public static EarningResponse fromEntity(InstructorEarning e, String courseName) {
        return EarningResponse.builder()
                .id(e.getId())
                .sourceType(e.getSourceType() != null ? e.getSourceType().name() : null)
                .courseId(e.getCourseId())
                .courseName(courseName)
                .amount(e.getAmount())
                .platformFee(e.getPlatformFee())
                .netAmount(e.getNetAmount())
                .currency(e.getCurrency())
                .payoutStatus(e.getPayoutStatus() != null ? e.getPayoutStatus().name() : null)
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
