package com.academy.dto.response;

import com.academy.entity.PaymentTransaction;
import com.academy.entity.enums.PaymentStatus;
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
public class PaymentTransactionResponse {

    private UUID id;
    private String payzoneOrderId;
    private String payzoneTransactionId;
    private String transactionType;
    private String courseName;       // populated for COURSE_PURCHASE transactions
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String paymentMethod;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public static PaymentTransactionResponse fromEntity(PaymentTransaction t, String courseName) {
        return PaymentTransactionResponse.builder()
                .id(t.getId())
                .payzoneOrderId(t.getPayzoneOrderId())
                .payzoneTransactionId(t.getPayzoneTransactionId())
                .transactionType(t.getTransactionType())
                .courseName(courseName)
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .status(t.getStatus())
                .paymentMethod(t.getPaymentMethod())
                .errorMessage(t.getErrorMessage())
                .createdAt(t.getCreatedAt())
                .completedAt(t.getCompletedAt())
                .build();
    }

    public static PaymentTransactionResponse fromEntity(PaymentTransaction t) {
        return fromEntity(t, null);
    }
}
