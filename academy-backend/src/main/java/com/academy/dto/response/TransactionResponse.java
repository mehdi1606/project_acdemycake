package com.academy.dto.response;

import com.academy.entity.PaymentTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Flat DTO for PaymentTransaction — avoids lazy-loading the User relation
 * and exposes userName / userEmail as top-level fields the frontend expects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {

    private UUID   id;
    private String payzoneOrderId;
    private String payzoneTransactionId;
    private String transactionType;

    // User info (flattened from the lazy User relation)
    private UUID   userId;
    private String userName;
    private String userEmail;

    // Payment details
    private BigDecimal    amount;
    private String        currency;
    private String        status;
    private String        paymentMethod;

    // Reference (e.g. courseId for COURSE_PURCHASE)
    private UUID referenceId;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    /** Build from entity — call INSIDE a transaction so user proxy is accessible. */
    public static TransactionResponse from(PaymentTransaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .payzoneOrderId(tx.getPayzoneOrderId())
                .payzoneTransactionId(tx.getPayzoneTransactionId())
                .transactionType(tx.getTransactionType())
                .userId(tx.getUser() != null ? tx.getUser().getId() : null)
                .userName(tx.getUser() != null ? tx.getUser().getFullName() : "Unknown User")
                .userEmail(tx.getUser() != null ? tx.getUser().getEmail() : null)
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .status(tx.getStatus() != null ? tx.getStatus().name() : null)
                .paymentMethod(tx.getPaymentMethod())
                .referenceId(tx.getReferenceId())
                .createdAt(tx.getCreatedAt())
                .completedAt(tx.getCompletedAt())
                .build();
    }
}
