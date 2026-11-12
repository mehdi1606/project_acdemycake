package com.academy.service;

import com.academy.dto.request.CreateCouponRequest;
import com.academy.dto.response.CouponResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.ValidateCouponResponse;
import com.academy.entity.Coupon;
import com.academy.entity.User;

import java.math.BigDecimal;
import java.util.UUID;

public interface CouponService {

    /** Admin: create a new coupon */
    CouponResponse createCoupon(CreateCouponRequest request);

    /** Admin: list all coupons (paginated) */
    PageResponse<CouponResponse> getAllCoupons(int page, int size);

    /** Admin: deactivate a coupon */
    CouponResponse deactivateCoupon(UUID couponId);

    /** Admin: delete a coupon */
    void deleteCoupon(UUID couponId);

    /**
     * Validate a coupon code for the annual plan.
     * Returns discount details; never throws — wraps errors in the response.
     */
    ValidateCouponResponse validateCoupon(String code, User user, BigDecimal originalPrice);

    /**
     * Validates a coupon for this user and returns the final (discounted) price.
     * Called when the checkout is created; records nothing.
     *
     * @throws com.academy.exception.BadRequestException if coupon is invalid
     */
    BigDecimal applyCoupon(String code, User user, BigDecimal originalPrice);

    /**
     * Records that this user used the coupon. Called only after the payment
     * succeeded, so failed or abandoned checkouts never consume a coupon.
     */
    void recordUsage(String code, User user);
}
