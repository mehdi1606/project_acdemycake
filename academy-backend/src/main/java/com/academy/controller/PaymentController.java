package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.PaymentTransactionResponse;
import com.academy.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/course/{courseId}")
    @Operation(summary = "Initiate course purchase payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiateCoursePayment(@PathVariable UUID courseId) {
        PaymentResponse response = paymentService.initiateCoursePayment(courseId);
        return ResponseEntity.ok(ApiResponse.success("Payment initiated", response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle PayZone webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-PayZone-Signature", required = false) String signature) {

        paymentService.handlePayzoneWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }

    // NOTE: The unauthenticated GET /callback endpoint has been intentionally removed.
    // Payment status is now determined exclusively through the signed POST /webhook,
    // which verifies the X-PayZone-Signature header. Any redirect-based callback from
    // the payment gateway should only be used for UX purposes (redirect the browser to
    // the frontend success/failure page) — it must never trigger server-side processing.

    @GetMapping("/history")
    @Operation(summary = "Get user payment history")
    public ResponseEntity<ApiResponse<PageResponse<PaymentTransactionResponse>>> getPaymentHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<PaymentTransactionResponse> response = paymentService.getPaymentHistory(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transaction/{id}")
    @Operation(summary = "Get transaction details")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> getTransaction(@PathVariable UUID id) {
        PaymentTransactionResponse response = paymentService.getTransactionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
