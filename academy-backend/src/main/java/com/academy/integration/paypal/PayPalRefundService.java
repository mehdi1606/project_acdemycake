package com.academy.integration.paypal;

import com.academy.entity.PaymentTransaction;
import com.academy.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/** Admin refunds of PayPal orders (kept apart from PayPalPaymentService: PaymentService uses it). */
@Service
@RequiredArgsConstructor
public class PayPalRefundService {

    private final PayPalClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${paypal.currency:EUR}")       private String currency;
    @Value("${paypal.mad-per-unit:10.80}") private BigDecimal madPerUnit;

    /** Refund through PayPal. madAmount is converted at the rate the order was paid at. */
    public void refund(PaymentTransaction txn, BigDecimal madAmount, boolean full, String reason) {
        JsonNode data;
        try {
            data = txn.getCallbackData() == null ? mapper.createObjectNode() : mapper.readTree(txn.getCallbackData());
        } catch (Exception e) {
            data = mapper.createObjectNode();
        }
        String captureId = txn.getPayzoneTransactionId();
        if (captureId == null || captureId.isBlank()) captureId = data.path("captureId").asText("");
        if (captureId.isBlank()) {
            throw new BadRequestException("No PayPal capture recorded for this order");
        }
        String cur = data.path("currency").asText(currency);
        String value = null;
        if (!full) {
            BigDecimal rate = new BigDecimal(data.path("madPerUnit").asText(madPerUnit.toPlainString()));
            value = madAmount.divide(rate, 2, RoundingMode.HALF_UP).toPlainString();
        }
        try {
            client.refundCapture(captureId, value, cur, reason, "refund-" + UUID.randomUUID());
        } catch (PayPalClient.PayPalException e) {
            throw new BadRequestException("PayPal refused the refund: " + (e.getIssue() != null ? e.getIssue() : e.getMessage()));
        }
    }
}
