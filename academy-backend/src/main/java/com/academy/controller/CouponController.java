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
    private final com.academy.repository.CourseRepository courseRepository;
    private final com.academy.service.EbookService ebookService;

    @GetMapping("/validate")
    @Operation(summary = "Check a coupon for a purchase: target SUBSCRIPTION (planId), COURSE or EBOOK (itemId). The server decides the price.")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateCoupon(
            @RequestParam String code,
            @RequestParam(defaultValue = "SUBSCRIPTION") String target,
            @RequestParam(required = false) String planId,
            @RequestParam(required = false) java.util.UUID itemId) {

        User user = null;
        try {
            UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            user = userService.findById(principal.getId());
        } catch (Exception ignored) {
            // Not authenticated — still validate but skip user-specific checks
        }

        String kind = target == null ? "SUBSCRIPTION" : target.trim().toUpperCase();
        java.math.BigDecimal price;
        switch (kind) {
            case "COURSE" -> {
                if (itemId == null) return invalid(code, "Missing course");
                var course = courseRepository.findById(itemId).orElse(null);
                if (course == null || course.getPrice() == null) return invalid(code, "Course not found");
                price = course.getPrice();
            }
            case "EBOOK" -> {
                if (itemId == null) return invalid(code, "Missing ebook");
                price = ebookService.findById(itemId).getPrice();
            }
            default -> {
                kind = "SUBSCRIPTION";
                if ("monthly".equalsIgnoreCase(planId)) {
                    price = settingsService.getMonthlyPrice();
                } else {
                    // While an offer runs its price is already applied: coupons don't stack on top.
                    if (settingsService.getActiveYearlyPromo().isPresent()) {
                        return invalid(code, "Coupons can't be combined with the current offer: the offer price is already applied.");
                    }
                    // The live (admin-editable) yearly price, so the preview matches the charge.
                    price = settingsService.getYearlyPrice();
                }
            }
        }
        return ResponseEntity.ok(ApiResponse.success(couponService.validateCoupon(code, user, price, kind)));
    }

    private static ResponseEntity<ApiResponse<ValidateCouponResponse>> invalid(String code, String message) {
        return ResponseEntity.ok(ApiResponse.success(ValidateCouponResponse.builder().valid(false).code(code).message(message).build()));
    }
}
