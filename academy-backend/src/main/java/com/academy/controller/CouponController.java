package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.ValidateCouponResponse;
import com.academy.entity.User;
import com.academy.security.UserPrincipal;
import com.academy.service.CouponService;
import com.academy.service.SettingsService;
import com.academy.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon validation for students")
public class CouponController {

    private final CouponService couponService;
    private final UserService userService;
    private final SettingsService settingsService;

    @GetMapping("/validate")
    @Operation(summary = "Validate a coupon code for the annual plan")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateCoupon(
            @RequestParam String code) {

        User user = null;
        try {
            UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            user = userService.findById(principal.getId());
        } catch (Exception ignored) {
            // Not authenticated — still validate but skip user-specific checks
        }

        // Use the live (admin-editable) yearly price so the coupon preview matches the charge.
        ValidateCouponResponse result = couponService.validateCoupon(code, user, settingsService.getYearlyPrice());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
