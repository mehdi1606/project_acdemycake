package com.academy.repository;

import com.academy.entity.InstructorPayout;
import com.academy.entity.User;
import com.academy.entity.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface InstructorPayoutRepository extends JpaRepository<InstructorPayout, UUID> {

    Page<InstructorPayout> findByInstructorOrderByCreatedAtDesc(User instructor, Pageable pageable);

    Page<InstructorPayout> findByStatusOrderByCreatedAtDesc(PayoutStatus status, Pageable pageable);

    @Query("SELECT SUM(p.amount) FROM InstructorPayout p WHERE p.instructor = :instructor AND p.status = 'COMPLETED'")
    BigDecimal sumCompletedPayoutsByInstructor(@Param("instructor") User instructor);

    /** Payouts asked for but not paid yet — they reserve part of the pending balance. */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM InstructorPayout p WHERE p.instructor = :instructor " +
           "AND p.status IN (com.academy.entity.enums.PayoutStatus.PENDING, " +
           "com.academy.entity.enums.PayoutStatus.REQUESTED, com.academy.entity.enums.PayoutStatus.PROCESSING)")
    BigDecimal sumOpenPayoutsByInstructor(@Param("instructor") User instructor);
}
