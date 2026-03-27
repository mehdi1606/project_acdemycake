package com.academy.repository;

import com.academy.entity.InstructorEarning;
import com.academy.entity.User;
import com.academy.entity.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InstructorEarningRepository extends JpaRepository<InstructorEarning, UUID> {

    Page<InstructorEarning> findByInstructorOrderByCreatedAtDesc(User instructor, Pageable pageable);

    @Query("SELECT SUM(e.netAmount) FROM InstructorEarning e WHERE e.instructor = :instructor")
    BigDecimal sumTotalEarningsByInstructor(@Param("instructor") User instructor);

    @Query("SELECT SUM(e.netAmount) FROM InstructorEarning e WHERE e.instructor = :instructor AND e.payoutStatus = 'PENDING'")
    BigDecimal sumPendingEarningsByInstructor(@Param("instructor") User instructor);

    @Query("SELECT SUM(e.netAmount) FROM InstructorEarning e WHERE e.instructor = :instructor AND e.createdAt >= :since")
    BigDecimal sumEarningsByInstructorSince(@Param("instructor") User instructor, @Param("since") LocalDateTime since);

    @Query("SELECT e FROM InstructorEarning e WHERE e.instructor = :instructor AND e.payoutStatus = :status")
    Page<InstructorEarning> findByInstructorAndPayoutStatus(
            @Param("instructor") User instructor,
            @Param("status") PayoutStatus status,
            Pageable pageable
    );

    /**
     * Returns rows of [year (int), month (int), totalNetAmount (BigDecimal)]
     * for the instructor's earnings since the given date, grouped by month.
     * Uses a native PostgreSQL query so EXTRACT works correctly.
     */
    @Query(value =
            "SELECT EXTRACT(YEAR  FROM e.created_at)::int AS year, " +
            "       EXTRACT(MONTH FROM e.created_at)::int AS month, " +
            "       COALESCE(SUM(e.net_amount), 0)          AS total " +
            "FROM instructor_earnings e " +
            "WHERE e.instructor_id = :instructorId AND e.created_at >= :since " +
            "GROUP BY EXTRACT(YEAR FROM e.created_at), EXTRACT(MONTH FROM e.created_at) " +
            "ORDER BY year, month",
            nativeQuery = true)
    List<Object[]> getMonthlyEarnings(
            @Param("instructorId") UUID instructorId,
            @Param("since") LocalDateTime since
    );
}
