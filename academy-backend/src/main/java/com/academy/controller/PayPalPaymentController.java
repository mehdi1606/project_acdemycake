package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.entity.User;
import com.academy.integration.paypal.PayPalPaymentService;
import com.academy.integration.paypal.PayPalPaymentService.Initiated;
import com.academy.integration.paypal.PayPalPaymentService.Result;
import com.academy.security.UserPrincipal;
import com.academy.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * PayPal checkout endpoints.
 *
 * GET  /api/v1/payments/paypal/config                — is PayPal on, currency and rate (public)
 * POST /api/v1/payments/paypal/initiate/subscription — returns the PayPal approval URL
 * POST /api/v1/payments/paypal/initiate/course/{id}
 * POST /api/v1/payments/paypal/initiate/ebook/{id}
 * GET  /api/v1/payments/paypal/return?token=…        — buyer back from PayPal (public)
 * GET  /api/v1/payments/paypal/cancel?token=…        — buyer cancelled on PayPal (public)
 * POST /api/v1/payments/paypal/webhook               — PayPal events (public; re-reads the order from PayPal)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/paypal")
@RequiredArgsConstructor
@Tag(name = "PayPal Payment", description = "PayPal checkout endpoints")
public class PayPalPaymentController {

    private final PayPalPaymentService payPal;
    private final UserService          userService;
    private final ObjectMapper         mapper = new ObjectMapper();

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping("/config")
    @Operation(summary = "PayPal availability, currency and MAD conversion rate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("enabled", payPal.isEnabled());
        body.put("currency", payPal.getCurrency());
        body.put("madPerUnit", payPal.getMadPerUnit());
        return ResponseEntity.ok(ApiResponse.success(body));
    }

    @PostMapping("/initiate/subscription")
    public ResponseEntity<ApiResponse<Initiated>> initiateSubscription(
            @RequestParam(defaultValue = "yearly") String planId,
            @RequestParam(required = false) String couponCode,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userService.findById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("PayPal order ready", payPal.initiateSubscription(planId, couponCode, user)));
    }

    @PostMapping("/initiate/course/{courseId}")
    public ResponseEntity<ApiResponse<Initiated>> initiateCourse(@PathVariable UUID courseId,
                                                                 @RequestParam(required = false) String couponCode,
                                                                 @AuthenticationPrincipal UserPrincipal principal) {
        User user = userService.findById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("PayPal order ready", payPal.initiateCourse(courseId, couponCode, user)));
    }

    @PostMapping("/initiate/ebook/{ebookId}")
    public ResponseEntity<ApiResponse<Initiated>> initiateEbook(@PathVariable UUID ebookId,
                                                                @RequestParam(required = false) String couponCode,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        User user = userService.findById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("PayPal order ready", payPal.initiateEbook(ebookId, couponCode, user)));
    }

    // ── Browser back from PayPal (NO JWT) ─────────────────────────────────────

    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(@RequestParam(name = "token", required = false) String token) {
        Result r = null;
        String outcome = "pending";
        if (token != null && !token.isBlank()) {
            try {
                r = payPal.complete(token);
                outcome = switch (r.outcome()) {
                    case SUCCESS -> "success";
                    case FAILED  -> "failed";
                    case PENDING -> "pending";
                };
            } catch (Exception e) {
                // PayPal briefly unreachable: the webhook settles it; the page polls.
                log.error("PayPal return processing error for {}: {}", token, e.getMessage());
            }
        }
        return redirect(r, outcome);
    }

    @GetMapping("/cancel")
    public ResponseEntity<Void> handleCancel(@RequestParam(name = "token", required = false) String token) {
        Result r = null;
        String outcome = "failed";
        if (token != null && !token.isBlank()) {
            try {
                r = payPal.cancel(token);
                if (r.outcome() == PayPalPaymentService.Outcome.SUCCESS) outcome = "success";
                else if (r.outcome() == PayPalPaymentService.Outcome.PENDING) outcome = "pending";
            } catch (Exception e) {
                log.error("PayPal cancel processing error for {}: {}", token, e.getMessage());
            }
        }
        return redirect(r, outcome);
    }

    private ResponseEntity<Void> redirect(Result r, String outcome) {
        URI target = UriComponentsBuilder.fromUriString(frontendUrl + "/payment/callback")
                .queryParam("txn", r != null && r.transactionId() != null ? r.transactionId().toString() : "")
                .queryParam("oid", r != null && r.orderRef() != null ? r.orderRef() : "")
                .queryParam("result", outcome)
                .queryParam("via", "paypal")
                .build().encode().toUri();
        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }

    // ── Webhook (NO JWT) ──────────────────────────────────────────────────────

    /**
     * Nothing in the event is trusted: it only names an order, which is then read
     * back from PayPal with our own credentials and settled like a browser return.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody String raw) {
        try {
            JsonNode event = mapper.readTree(raw);
            String type = event.path("event_type").asText("");
            JsonNode res = event.path("resource");
            String orderId = switch (type) {
                case "CHECKOUT.ORDER.APPROVED", "CHECKOUT.ORDER.COMPLETED" -> res.path("id").asText("");
                case "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.PENDING" ->
                        res.path("supplementary_data").path("related_ids").path("order_id").asText("");
                default -> "";
            };
            log.info("PayPal webhook {} order={}", type, orderId);
            if (!orderId.isBlank() && orderId.matches("[A-Z0-9]{5,40}")) {
                payPal.complete(orderId);
            }
        } catch (com.academy.integration.paypal.PayPalClient.PayPalException e) {
            if (e.getStatus() == 404) return ResponseEntity.ok("UNKNOWN_ORDER");
            log.error("PayPal webhook processing error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ERROR");
        } catch (Exception e) {
            log.error("PayPal webhook processing error: {}", e.getMessage());
            // 500 → PayPal retries later.
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ERROR");
        }
        return ResponseEntity.ok("OK");
    }
}
