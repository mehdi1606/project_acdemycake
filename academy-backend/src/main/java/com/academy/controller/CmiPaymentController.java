package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.CmiInitiateResponse;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import com.academy.integration.cmi.CmiPaymentService;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * CMI Chaabi Payment endpoints.
 *
 * POST /api/v1/payments/cmi/initiate/subscription   — initiate subscription payment
 * POST /api/v1/payments/cmi/initiate/course/{id}    — initiate course purchase
 * POST /api/v1/payments/cmi/callback                — CMI server-to-server callback (no JWT)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/cmi")
@RequiredArgsConstructor
@Tag(name = "CMI Payment", description = "CMI Chaabi payment gateway endpoints")
public class CmiPaymentController {

    private final CmiPaymentService            cmiPaymentService;
    private final UserService                  userService;
    private final PaymentTransactionRepository transactionRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // ── Subscription ──────────────────────────────────────────────────────────

    @PostMapping("/initiate/subscription")
    @Operation(summary = "Initiate CMI subscription payment — returns form params to submit to gateway")
    public ResponseEntity<ApiResponse<CmiInitiateResponse>> initiateSubscription(
            @RequestParam(defaultValue = "yearly") String planId,
            @RequestParam(required = false)         String couponCode,
            @AuthenticationPrincipal UserPrincipal  principal) {

        User user = userService.findById(principal.getId());
        CmiInitiateResponse response = cmiPaymentService.initiateCmiSubscription(planId, couponCode, user);
        return ResponseEntity.ok(ApiResponse.success("CMI payment form ready", response));
    }

    // ── Course purchase ───────────────────────────────────────────────────────

    @PostMapping("/initiate/course/{courseId}")
    @Operation(summary = "Initiate CMI course purchase — returns form params to submit to gateway")
    public ResponseEntity<ApiResponse<CmiInitiateResponse>> initiateCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userService.findById(principal.getId());
        CmiInitiateResponse response = cmiPaymentService.initiateCmiCoursePayment(courseId, user);
        return ResponseEntity.ok(ApiResponse.success("CMI payment form ready", response));
    }

    @PostMapping("/initiate/ebook/{ebookId}")
    @Operation(summary = "Initiate CMI ebook purchase — no subscription required")
    public ResponseEntity<ApiResponse<CmiInitiateResponse>> initiateEbook(
            @PathVariable UUID ebookId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userService.findById(principal.getId());
        CmiInitiateResponse response = cmiPaymentService.initiateCmiEbookPayment(ebookId, user);
        return ResponseEntity.ok(ApiResponse.success("CMI payment form ready", response));
    }

    // ── Browser return after payment (NO JWT) ─────────────────────────────────

    /**
     * CMI POSTs the browser to okUrl / failUrl after every payment attempt.
     *
     * okUrl  → .../cmi/return/success   (configured separately from failUrl)
     * failUrl → .../cmi/return/failed   (distinct URL → result is unambiguous)
     *
     * This endpoint converts CMI's POST into a GET redirect to the React SPA,
     * carrying the order reference and outcome so the callback page can show the
     * correct status + order details WITHOUT depending on sessionStorage
     * (which is what produced the "No payment reference found" screen).
     *
     * The outcome is derived from, in priority order:
     *   1. the URL path (/success vs /failed) — driven by okUrl/failUrl
     *   2. CMI's ProcReturnCode in the POST body ("00" = success)
     *
     * Mapped to GET + POST so it works whether CMI POSTs the form or (on some
     * cancel flows) issues a GET.
     */
    @RequestMapping(
        value  = { "/return", "/return/success", "/return/failed" },
        method = { RequestMethod.GET, RequestMethod.POST }
    )
    @Operation(summary = "CMI browser return URL — converts POST to GET redirect with order ref + result")
    public ResponseEntity<Void> handleReturn(HttpServletRequest request,
                                             @RequestParam Map<String, String> params) {
        String path = request.getRequestURI();
        String oid  = firstNonBlank(params.get("oid"), params.get("orderId"));
        String procReturnCode = params.getOrDefault("ProcReturnCode", "");

        // Resolve outcome: explicit path wins, then ProcReturnCode, then any "result" hint
        String outcome;
        if (path.endsWith("/success")) {
            outcome = "success";
        } else if (path.endsWith("/failed")) {
            outcome = "failed";
        } else if ("00".equals(procReturnCode)) {
            outcome = "success";
        } else if (!procReturnCode.isBlank()) {
            outcome = "failed";
        } else {
            outcome = firstNonBlank(params.get("result"), "pending");
        }

        // Map the CMI order id (oid) → our transaction UUID so the SPA can poll the
        // authoritative status set by the server-to-server callback.
        String txnId = "";
        if (!oid.isBlank()) {
            txnId = transactionRepository.findByPayzoneOrderId(oid)
                    .map(t -> t.getId().toString())
                    .orElse("");
        }

        URI target = UriComponentsBuilder.fromUriString(frontendUrl + "/payment/callback")
                .queryParam("txn", txnId)
                .queryParam("oid", oid)
                .queryParam("result", outcome)
                .build()
                .encode()
                .toUri();

        log.info("CMI browser return [{}] → oid={} txn={} outcome={} redirect={}",
                path, oid, txnId, outcome, target);
        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }

    private static String firstNonBlank(String... values) {
        if (values != null) {
            for (String v : values) {
                if (v != null && !v.isBlank()) return v;
            }
        }
        return "";
    }

    // ── Public transaction status (NO JWT required) ───────────────────────────

    /**
     * Public polling endpoint for the payment callback page.
     *
     * Returns only the status and type of a transaction — not sensitive details.
     * The UUID is 128-bit random, making it safe to expose without authentication.
     * This allows the payment callback page to poll even if the JWT has expired.
     *
     * Permitted in SecurityConfig as permitAll().
     */
    @GetMapping("/status/{transactionId}")
    @Operation(summary = "Get payment status by transaction UUID — no auth required")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPaymentStatus(
            @PathVariable UUID transactionId) {

        return transactionRepository.findById(transactionId)
                .map(tx -> {
                    Map<String, String> body = new HashMap<>();
                    body.put("status",          tx.getStatus() != null ? tx.getStatus().name() : PaymentStatus.PENDING.name());
                    body.put("transactionType", tx.getTransactionType() != null ? tx.getTransactionType() : "");
                    body.put("errorMessage",    tx.getErrorMessage() != null ? tx.getErrorMessage() : "");
                    body.put("orderId",         tx.getPayzoneOrderId() != null ? tx.getPayzoneOrderId() : "");
                    body.put("amount",          tx.getAmount() != null ? tx.getAmount().toPlainString() : "");
                    body.put("currency",        tx.getCurrency() != null ? tx.getCurrency() : "");
                    return ResponseEntity.ok(ApiResponse.success(body));
                })
                .orElseGet(() -> {
                    Map<String, String> body = new HashMap<>();
                    body.put("status", "NOT_FOUND");
                    body.put("transactionType", "");
                    body.put("errorMessage", "");
                    body.put("orderId", "");
                    body.put("amount", "");
                    body.put("currency", "");
                    return ResponseEntity.ok(ApiResponse.success(body));
                });
    }

    // ── Server-to-server callback (NO JWT — excluded from Spring Security) ────

    /**
     * Called by CMI servers after every payment attempt.
     *
     * Must return plain text (NOT JSON):
     *   "ACTION=POSTAUTH"  — payment accepted, debit the card automatically
     *   "APPROVED"         — acknowledge without debiting (failed/rejected payment)
     *   "FAILURE"          — hash mismatch or processing error (CMI will retry)
     *
     * This endpoint is listed in SecurityConfig as permitAll().
     *
     * NOTE: NO `consumes` restriction — CMI sometimes omits or varies the
     * Content-Type header; Spring must accept the callback regardless.
     */
    @PostMapping(
        value = "/callback",
        produces = MediaType.TEXT_PLAIN_VALUE
    )
    @Operation(summary = "CMI server-to-server payment callback")
    public ResponseEntity<String> handleCallback(
            @RequestParam Map<String, String> params) {

        log.info("CMI callback received — oid={} ProcReturnCode={} params={}",
                params.get("oid"), params.get("ProcReturnCode"), params.keySet());

        String result = cmiPaymentService.handleCmiCallback(params);

        log.info("CMI callback response — oid={} result={}", params.get("oid"), result);
        return ResponseEntity.ok(result);
    }
}
