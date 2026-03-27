package com.academy.service;

import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.PaymentTransactionResponse;
import com.academy.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentService {

    PaymentResponse initiateCoursePayment(UUID courseId);

    PaymentResponse initiateSubscriptionPayment();

    void handlePayzoneWebhook(String payload, String signature);

    void processPaymentCallback(String orderId, String status, String transactionId);

    PageResponse<PaymentTransactionResponse> getPaymentHistory(int page, int size);

    PaymentTransactionResponse getTransactionById(UUID id);

    void processRefund(UUID transactionId, BigDecimal amount, String reason);
}
