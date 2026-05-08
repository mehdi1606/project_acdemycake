package com.academy.controller;

import com.academy.dto.request.SubscribeRequest;
import com.academy.dto.response.*;
import com.academy.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.academy.service.PaymentService;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Subscription management endpoints")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PaymentService paymentService;

    @GetMapping("/plans")
    @Operation(summary = "Get available subscription plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        List<SubscriptionPlanResponse> plans = subscriptionService.getSubscriptionPlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @PostMapping("/subscribe")
    @Operation(summary = "Initiate subscription payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> subscribe(
            @Valid @RequestBody SubscribeRequest request) {
        PaymentResponse response = subscriptionService.subscribe(request.getPlanId(), request.getCouponCode());
        return ResponseEntity.ok(ApiResponse.success("Payment initiated", response));
    }

    @GetMapping("/my-subscription")
    @Operation(summary = "Get current user's subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getMySubscription() {
        SubscriptionResponse response = subscriptionService.getMySubscription();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Cancel subscription (at period end)")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription() {
        subscriptionService.cancelSubscription();
        return ResponseEntity.ok(ApiResponse.success("Subscription will be cancelled at period end"));
    }

    @PostMapping("/reactivate")
    @Operation(summary = "Reactivate a cancelled subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> reactivateSubscription() {
        SubscriptionResponse response = subscriptionService.reactivateSubscription();
        return ResponseEntity.ok(ApiResponse.success("Subscription reactivated", response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get subscription history")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionResponse>>> getSubscriptionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<SubscriptionResponse> response = subscriptionService.getSubscriptionHistory(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle PayZone webhook for subscriptions")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-PayZone-Signature", required = false) String signature) {

        paymentService.handlePayzoneWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }
}
