package com.academy.repository;

import com.academy.entity.Coupon;
import com.academy.entity.CouponUsage;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, UUID> {

    boolean existsByCouponAndUser(Coupon coupon, User user);
}
