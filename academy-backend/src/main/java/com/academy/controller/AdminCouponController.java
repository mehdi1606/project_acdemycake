package com.academy.controller;

import com.academy.dto.request.CreateCouponRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.CouponResponse;
import com.academy.dto.response.PageResponse;
import com.academy.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Coupons", description = "Admin coupon management")
public class AdminCouponController {

    private final CouponService couponService;

    @PostMapping
    @Operation(summary = "Create a new coupon")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CreateCouponRequest request) {
        CouponResponse coupon = couponService.createCoupon(request);
        return ResponseEntity.ok(ApiResponse.success("Coupon created", coupon));
    }

    @GetMapping
    @Operation(summary = "List all coupons (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<CouponResponse>>> getAllCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<CouponResponse> coupons = couponService.getAllCoupons(page, size);
        return ResponseEntity.ok(ApiResponse.success(coupons));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a coupon")
    public ResponseEntity<ApiResponse<CouponResponse>> deactivateCoupon(@PathVariable UUID id) {
        CouponResponse coupon = couponService.deactivateCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deactivated", coupon));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a coupon")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable UUID id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted"));
    }
}
