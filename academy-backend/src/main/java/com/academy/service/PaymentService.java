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

    /**
     * Admin-only: force-reprocess a payment that was authorised by CMI but whose
     * subscription / course-access was never activated (e.g. due to the old bug where
     * the transaction was saved as COMPLETED before processSuccessfulPayment ran).
     *
     * Resets the transaction status to PENDING (so the normal guards don't block it)
     * then runs the full success flow.
     */
    void adminForceReprocessPayment(String orderId);

    PageResponse<PaymentTransactionResponse> getPaymentHistory(int page, int size);

    PaymentTransactionResponse getTransactionById(UUID id);

    void processRefund(UUID transactionId, BigDecimal amount, String reason);
}
