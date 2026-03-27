package com.academy.integration.payzone;

import com.academy.dto.response.PaymentResponse;
import com.academy.entity.enums.PaymentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.PaymentException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayZoneService {

    private final ObjectMapper objectMapper;

    @Value("${payzone.api-url}")
    private String apiUrl;

    @Value("${payzone.merchant-id}")
    private String merchantId;

    @Value("${payzone.api-key}")
    private String apiKey;

    @Value("${payzone.secret-key}")
    private String secretKey;

    @Value("${payzone.callback-url}")
    private String callbackUrl;

    @Value("${payzone.return-url}")
    private String returnUrl;

    public PaymentResponse initiatePayment(String orderId, BigDecimal amount, String currency,
                                            String description, String customerEmail) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("merchantId", merchantId);
            requestBody.put("orderId", orderId);
            requestBody.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            requestBody.put("currency", currency);
            requestBody.put("description", description);
            requestBody.put("customerEmail", customerEmail);
            requestBody.put("callbackUrl", callbackUrl);
            requestBody.put("returnUrl", returnUrl + "?orderId=" + orderId);
            requestBody.put("language", "fr");

            String signature = generateSignature(requestBody);
            requestBody.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            log.info("Initiating PayZone payment: orderId={}, amount={} {}", orderId, amount, currency);

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost(apiUrl + "/payments/initiate");
                httpPost.setHeader("Content-Type", "application/json");
                httpPost.setHeader("X-API-Key", apiKey);
                httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

                return httpClient.execute(httpPost, response -> {
                    int statusCode = response.getCode();
                    String responseBody = EntityUtils.toString(response.getEntity());

                    if (statusCode >= 200 && statusCode < 300) {
                        Map<String, Object> responseData = objectMapper.readValue(responseBody, Map.class);

                        String paymentUrl = (String) responseData.get("paymentUrl");
                        String transactionId = (String) responseData.get("transactionId");

                        log.info("PayZone payment initiated successfully: transactionId={}", transactionId);

                        return PaymentResponse.builder()
                                .transactionId(UUID.randomUUID())
                                .paymentUrl(paymentUrl)
                                .orderId(orderId)
                                .amount(amount)
                                .currency(currency)
                                .status(PaymentStatus.PENDING)
                                .message("Payment initiated successfully")
                                .build();
                    } else {
                        log.error("PayZone API error: status={}, response={}", statusCode, responseBody);
                        throw new PaymentException("Payment initiation failed: " + responseBody);
                    }
                });
            }

        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to initiate PayZone payment: {}", e.getMessage(), e);
            throw new PaymentException("Failed to initiate payment: " + e.getMessage());
        }
    }

    public Map<String, Object> parseWebhook(String payload, String signature) {
        if (!verifyWebhookSignature(payload, signature)) {
            throw new BadRequestException("Invalid webhook signature");
        }

        try {
            Map<String, Object> webhookData = objectMapper.readValue(payload, Map.class);
            log.info("Received PayZone webhook: {}", webhookData.get("event"));
            return webhookData;

        } catch (Exception e) {
            log.error("Failed to parse PayZone webhook: {}", e.getMessage());
            throw new BadRequestException("Failed to parse webhook: " + e.getMessage());
        }
    }

    public boolean processCallback(String orderId, String status, String transactionId, String signature) {
        Map<String, Object> callbackData = new HashMap<>();
        callbackData.put("orderId", orderId);
        callbackData.put("status", status);
        callbackData.put("transactionId", transactionId);

        String expectedSignature = generateSignature(callbackData);

        if (!signature.equals(expectedSignature)) {
            log.warn("Invalid callback signature for order: {}", orderId);
            return false;
        }

        log.info("Valid PayZone callback: orderId={}, status={}", orderId, status);
        return true;
    }

    public PaymentResponse processRefund(String transactionId, BigDecimal amount, String reason) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("merchantId", merchantId);
            requestBody.put("transactionId", transactionId);
            requestBody.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            requestBody.put("reason", reason);

            String signature = generateSignature(requestBody);
            requestBody.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            log.info("Processing PayZone refund: transactionId={}, amount={}", transactionId, amount);

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost(apiUrl + "/payments/refund");
                httpPost.setHeader("Content-Type", "application/json");
                httpPost.setHeader("X-API-Key", apiKey);
                httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

                return httpClient.execute(httpPost, response -> {
                    int statusCode = response.getCode();
                    String responseBody = EntityUtils.toString(response.getEntity());

                    if (statusCode >= 200 && statusCode < 300) {
                        log.info("PayZone refund processed successfully");

                        return PaymentResponse.builder()
                                .status(PaymentStatus.REFUNDED)
                                .amount(amount)
                                .message("Refund processed successfully")
                                .build();
                    } else {
                        log.error("PayZone refund error: status={}, response={}", statusCode, responseBody);
                        throw new PaymentException("Refund failed: " + responseBody);
                    }
                });
            }

        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process PayZone refund: {}", e.getMessage(), e);
            throw new PaymentException("Failed to process refund: " + e.getMessage());
        }
    }

    private String generateSignature(Map<String, Object> data) {
        try {
            StringBuilder sb = new StringBuilder();
            data.keySet().stream()
                    .sorted()
                    .forEach(key -> {
                        if (!"signature".equals(key)) {
                            sb.append(key).append("=").append(data.get(key)).append("&");
                        }
                    });

            if (sb.length() > 0) {
                sb.deleteCharAt(sb.length() - 1);
            }

            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            hmac.init(secretKeySpec);
            byte[] hash = hmac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(hash);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to generate signature: {}", e.getMessage());
            throw new PaymentException("Failed to generate payment signature");
        }
    }

    private boolean verifyWebhookSignature(String payload, String signature) {
        if (signature == null || signature.isBlank()) {
            return false;
        }

        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            hmac.init(secretKeySpec);
            byte[] hash = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hash);

            return signature.equals(computedSignature);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to verify webhook signature: {}", e.getMessage());
            return false;
        }
    }
}
