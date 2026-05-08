package com.academy.service.impl;

import com.academy.dto.request.CreateCouponRequest;
import com.academy.dto.response.CouponResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.ValidateCouponResponse;
import com.academy.entity.Coupon;
import com.academy.entity.CouponUsage;
import com.academy.entity.User;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CouponRepository;
import com.academy.repository.CouponUsageRepository;
import com.academy.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    @Override
    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request) {
        String code = request.getCode().trim().toUpperCase();

        if (couponRepository.existsByCode(code)) {
            throw new BadRequestException("A coupon with code '" + code + "' already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(code)
                .discountPercent(request.getDiscountPercent())
                .maxUses(request.getMaxUses())
                .expiresAt(request.getExpiresAt())
                .description(request.getDescription())
                .isActive(true)
                .usedCount(0)
                .build();

        coupon = couponRepository.save(coupon);
        log.info("Coupon created: {} ({}% off)", code, request.getDiscountPercent());
        return CouponResponse.fromEntity(coupon);
    }

    @Override
    public PageResponse<CouponResponse> getAllCoupons(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(couponRepository.findAllByOrderByCreatedAtDesc(pageRequest), CouponResponse::fromEntity);
    }

    @Override
    @Transactional
    public CouponResponse deactivateCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setIsActive(false);
        coupon = couponRepository.save(coupon);
        log.info("Coupon deactivated: {}", coupon.getCode());
        return CouponResponse.fromEntity(coupon);
    }

    @Override
    @Transactional
    public void deleteCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        couponRepository.delete(coupon);
        log.info("Coupon deleted: {}", coupon.getCode());
    }

    @Override
    public ValidateCouponResponse validateCoupon(String code, User user, BigDecimal originalPrice) {
        if (code == null || code.isBlank()) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .message("Coupon code is required")
                    .build();
        }

        String normalizedCode = code.trim().toUpperCase();

        Coupon coupon = couponRepository.findByCode(normalizedCode).orElse(null);
        if (coupon == null) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(normalizedCode)
                    .message("Invalid coupon code")
                    .build();
        }

        if (!coupon.getIsActive()) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(normalizedCode)
                    .message("This coupon is no longer active")
                    .build();
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(normalizedCode)
                    .message("This coupon has expired")
                    .build();
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(normalizedCode)
                    .message("This coupon has reached its maximum usage limit")
                    .build();
        }

        if (user != null && couponUsageRepository.existsByCouponAndUser(coupon, user)) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .code(normalizedCode)
                    .message("You have already used this coupon")
                    .build();
        }

        BigDecimal discountAmount = originalPrice
                .multiply(coupon.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalPrice = originalPrice.subtract(discountAmount).max(BigDecimal.ZERO);

        return ValidateCouponResponse.builder()
                .valid(true)
                .code(normalizedCode)
                .discountPercent(coupon.getDiscountPercent())
                .originalPrice(originalPrice)
                .discountAmount(discountAmount)
                .finalPrice(finalPrice)
                .message("Coupon applied: " + coupon.getDiscountPercent().stripTrailingZeros().toPlainString() + "% discount")
                .build();
    }

    @Override
    @Transactional
    public BigDecimal applyCoupon(String code, User user, BigDecimal originalPrice) {
        String normalizedCode = code.trim().toUpperCase();

        Coupon coupon = couponRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code: " + normalizedCode));

        if (!coupon.getIsActive()) {
            throw new BadRequestException("Coupon '" + normalizedCode + "' is no longer active");
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon '" + normalizedCode + "' has expired");
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new BadRequestException("Coupon '" + normalizedCode + "' has reached its usage limit");
        }

        if (couponUsageRepository.existsByCouponAndUser(coupon, user)) {
            throw new BadRequestException("You have already used coupon '" + normalizedCode + "'");
        }

        // Record the usage
        CouponUsage usage = CouponUsage.builder()
                .coupon(coupon)
                .user(user)
                .usedAt(LocalDateTime.now())
                .build();
        couponUsageRepository.save(usage);

        // Increment usage count
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        // Calculate final price
        BigDecimal discountAmount = originalPrice
                .multiply(coupon.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalPrice = originalPrice.subtract(discountAmount).max(BigDecimal.ZERO);

        log.info("Coupon {} applied for user {} — {} MAD → {} MAD",
                normalizedCode, user.getEmail(), originalPrice, finalPrice);

        return finalPrice;
    }
}
