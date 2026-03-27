package com.academy.dto.response;

import com.academy.entity.InstructorPayout;
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
public class PayoutResponse {

    private UUID id;
    private BigDecimal amount;
    private String currency;
    private String status;           // REQUESTED | PROCESSING | COMPLETED | REJECTED
    private String paymentMethod;
    private String transactionReference;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private LocalDateTime completedAt;

    public static PayoutResponse fromEntity(InstructorPayout p) {
        return PayoutResponse.builder()
                .id(p.getId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .paymentMethod(p.getPaymentMethod())
                .transactionReference(p.getTransactionReference())
                .notes(p.getNotes())
                .createdAt(p.getCreatedAt())
                .processedAt(p.getProcessedAt())
                .completedAt(p.getCompletedAt())
                .build();
    }
}
