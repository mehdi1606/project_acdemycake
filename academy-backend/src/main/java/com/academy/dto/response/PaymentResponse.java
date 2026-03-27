package com.academy.dto.response;

import com.academy.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID transactionId;
    private String paymentUrl;
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String message;
}
