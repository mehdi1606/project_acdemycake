package com.academy.repository;

import com.academy.entity.PaymentTransaction;
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
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByPayzoneTransactionId(String transactionId);

    Optional<PaymentTransaction> findByPayzoneOrderId(String orderId);

    Page<PaymentTransaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<PaymentTransaction> findByStatusOrderByCreatedAtDesc(PaymentStatus status, Pageable pageable);

    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ── Revenue aggregates (real CMI payments) ────────────────────────────────
    // COALESCE → never returns null; callers get BigDecimal.ZERO for empty sets.

    /** Total amount of all transactions in the given status (e.g. COMPLETED = realised revenue). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t WHERE t.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

    /** Total amount of transactions in the given status AND type (SUBSCRIPTION / COURSE_PURCHASE). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = :type")
    BigDecimal sumAmountByStatusAndType(@Param("status") PaymentStatus status,
                                        @Param("type") String type);

    /** Total amount in a status since a date (for "this month" figures). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.createdAt >= :since")
    BigDecimal sumAmountByStatusSince(@Param("status") PaymentStatus status,
                                      @Param("since") LocalDateTime since);

    /** Total amount in a status within a date window (for the monthly revenue chart). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.createdAt >= :start AND t.createdAt < :end")
    BigDecimal sumAmountByStatusBetween(@Param("status") PaymentStatus status,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    long countByStatus(PaymentStatus status);
}
