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

import java.net.URI;
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

    // ── Browser return after payment (NO JWT) ─────────────────────────────────

    /**
     * CMI POSTs the browser to okUrl / failUrl after every payment attempt.
     * Neither the React dev server nor nginx can serve index.html for a POST.
     * This endpoint accepts the POST and converts it to a GET redirect to the
     * React frontend — works identically on localhost and on production.
     *
     * The POST body from CMI is intentionally ignored: the React callback page
     * reads sessionStorage (sl_pending_txn_id) and polls the DB for status.
     */
    @PostMapping(
        value = "/return",
        consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE
    )
    @Operation(summary = "CMI browser return URL — converts POST to GET redirect")
    public ResponseEntity<Void> handleReturn() {
        URI target = URI.create(frontendUrl + "/payment/callback");
        log.info("CMI browser return → redirecting to {}", target);
        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
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
                    Map<String, String> body = Map.of(
                            "status",          tx.getStatus() != null ? tx.getStatus().name() : PaymentStatus.PENDING.name(),
                            "transactionType", tx.getTransactionType() != null ? tx.getTransactionType() : "",
                            "errorMessage",    tx.getErrorMessage() != null ? tx.getErrorMessage() : ""
                    );
                    return ResponseEntity.ok(ApiResponse.success(body));
                })
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(
                        Map.of("status", "NOT_FOUND", "transactionType", "", "errorMessage", ""))));
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
