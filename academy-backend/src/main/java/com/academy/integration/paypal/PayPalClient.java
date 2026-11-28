package com.academy.integration.paypal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Thin client for the PayPal REST API (OAuth token, Orders v2, refunds).
 *
 * Sandbox or live is chosen by paypal.mode; credentials come only from the
 * environment (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET), never from the code.
 */
@Slf4j
@Component
public class PayPalClient {

    private static final String SANDBOX = "https://api-m.sandbox.paypal.com";
    private static final String LIVE    = "https://api-m.paypal.com";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${paypal.mode:sandbox}")      private String mode;
    @Value("${paypal.client-id:}")        private String clientId;
    @Value("${paypal.client-secret:}")    private String clientSecret;

    private String token;
    private Instant tokenExpiry = Instant.EPOCH;

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public boolean isLive() {
        return "live".equalsIgnoreCase(mode);
    }

    private String base() {
        return isLive() ? LIVE : SANDBOX;
    }

    public ObjectNode newObject() {
        return mapper.createObjectNode();
    }

    /** POST /v2/checkout/orders — PayPal-Request-Id makes a retry return the same order. */
    public JsonNode createOrder(ObjectNode body, String requestId) {
        return call("POST", "/v2/checkout/orders", body, requestId);
    }

    public JsonNode getOrder(String orderId) {
        return call("GET", "/v2/checkout/orders/" + enc(orderId), null, null);
    }

    public JsonNode captureOrder(String orderId, String requestId) {
        return call("POST", "/v2/checkout/orders/" + enc(orderId) + "/capture", mapper.createObjectNode(), requestId);
    }

    /** Refund a capture; amount null = the whole capture. */
    public JsonNode refundCapture(String captureId, String value, String currency, String note, String requestId) {
        ObjectNode body = mapper.createObjectNode();
        if (value != null) {
            ObjectNode amount = body.putObject("amount");
            amount.put("value", value);
            amount.put("currency_code", currency);
        }
        if (note != null && !note.isBlank()) {
            body.put("note_to_payer", note.length() > 255 ? note.substring(0, 255) : note);
        }
        return call("POST", "/v2/payments/captures/" + enc(captureId) + "/refund", body, requestId);
    }

    // ── internals ─────────────────────────────────────────────────────────────

    private JsonNode call(String method, String path, JsonNode body, String requestId) {
        if (!isConfigured()) {
            throw new PayPalException("PayPal is not configured");
        }
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base() + path))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + accessToken())
                    .header("Content-Type", "application/json")
                    .header("Prefer", "return=representation");
            if (requestId != null) b.header("PayPal-Request-Id", requestId);
            if ("GET".equals(method)) {
                b.GET();
            } else {
                b.method(method, HttpRequest.BodyPublishers.ofString(body == null ? "{}" : mapper.writeValueAsString(body)));
            }
            HttpResponse<String> res = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode json = res.body() == null || res.body().isBlank() ? mapper.createObjectNode() : mapper.readTree(res.body());
            if (res.statusCode() >= 300) {
                String issue = json.path("details").path(0).path("issue").asText(json.path("name").asText("ERROR"));
                log.warn("PayPal {} {} -> HTTP {} {} debug_id={}", method, path, res.statusCode(), issue, json.path("debug_id").asText());
                throw new PayPalException("PayPal error " + res.statusCode() + " " + issue, res.statusCode(), issue);
            }
            return json;
        } catch (IOException e) {
            throw new PayPalException("PayPal unreachable: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PayPalException("PayPal call interrupted");
        }
    }

    private synchronized String accessToken() throws IOException, InterruptedException {
        if (token != null && Instant.now().isBefore(tokenExpiry)) return token;
        String basic = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest req = HttpRequest.newBuilder(URI.create(base() + "/v1/oauth2/token"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Basic " + basic)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
                .build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            log.error("PayPal token request refused: HTTP {}", res.statusCode());
            throw new PayPalException("PayPal authentication failed (" + res.statusCode() + ")");
        }
        JsonNode json = mapper.readTree(res.body());
        token = json.path("access_token").asText();
        long ttl = json.path("expires_in").asLong(300);
        tokenExpiry = Instant.now().plusSeconds(Math.max(60, ttl - 120));
        return token;
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    public static class PayPalException extends RuntimeException {
        private final int status;
        private final String issue;

        public PayPalException(String msg) { this(msg, 0, null); }

        public PayPalException(String msg, int status, String issue) {
            super(msg);
            this.status = status;
            this.issue = issue;
        }

        public int getStatus() { return status; }
        public String getIssue() { return issue; }
    }
}
