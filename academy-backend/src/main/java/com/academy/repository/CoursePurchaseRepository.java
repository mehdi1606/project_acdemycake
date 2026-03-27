package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CoursePurchase;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoursePurchaseRepository extends JpaRepository<CoursePurchase, UUID> {

    Optional<CoursePurchase> findByUserAndCourseAndStatus(User user, Course course, PaymentStatus status);

    Optional<CoursePurchase> findByPayzonePaymentIntentId(String paymentIntentId);

    boolean existsByUserAndCourseAndStatus(User user, Course course, PaymentStatus status);

    Page<CoursePurchase> findByUser(User user, Pageable pageable);

    Page<CoursePurchase> findByCourse(Course course, Pageable pageable);

    @Query("SELECT SUM(p.amount) FROM CoursePurchase p WHERE p.course = :course AND p.status = 'COMPLETED'")
    BigDecimal sumRevenueByCourse(@Param("course") Course course);

    @Query("SELECT SUM(p.amount) FROM CoursePurchase p WHERE p.course.instructor = :instructor AND p.status = 'COMPLETED'")
    BigDecimal sumRevenueByInstructor(@Param("instructor") User instructor);

    @Query("SELECT SUM(p.amount) FROM CoursePurchase p WHERE p.status = 'COMPLETED' AND p.purchasedAt >= :since")
    BigDecimal sumRevenueSince(@Param("since") LocalDateTime since);

    @Query("SELECT SUM(p.amount) FROM CoursePurchase p WHERE p.status = 'COMPLETED'")
    BigDecimal sumTotalRevenue();
}
