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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByPayzoneTransactionId(String transactionId);

    Optional<PaymentTransaction> findByPayzoneOrderId(String orderId);

    /** Committed status read straight from the database (bypasses the loaded entity). */
    @Query("SELECT t.status FROM PaymentTransaction t WHERE t.id = :id")
    PaymentStatus findStatusById(@Param("id") UUID id);

    /**
     * Seats held by card payments that are still in progress: PENDING course
     * purchases of this course whose hold has not expired, made by anyone
     * other than {@code excludedUser} (a user's own retry never blocks them).
     */
    @Query("SELECT COUNT(t) FROM PaymentTransaction t " +
           "WHERE t.referenceId = :courseId AND t.transactionType = 'COURSE_PURCHASE' " +
           "AND t.status = com.academy.entity.enums.PaymentStatus.PENDING " +
           "AND t.expiresAt > :now AND t.user <> :excludedUser")
    long countActiveSeatHoldsExcludingUser(@Param("courseId") UUID courseId,
                                           @Param("now") LocalDateTime now,
                                           @Param("excludedUser") User excludedUser);

    /** Same as above, counting every user's holds (used for public availability). */
    @Query("SELECT COUNT(t) FROM PaymentTransaction t " +
           "WHERE t.referenceId = :courseId AND t.transactionType = 'COURSE_PURCHASE' " +
           "AND t.status = com.academy.entity.enums.PaymentStatus.PENDING " +
           "AND t.expiresAt > :now")
    long countActiveSeatHolds(@Param("courseId") UUID courseId,
                              @Param("now") LocalDateTime now);

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

    // ── Unfinished-payment reminders (PendingPaymentReminderJob) ──

    /** PENDING payments old enough for their next reminder (legacy rows, reminder_count -1, excluded). */
    @Query("SELECT t.id FROM PaymentTransaction t WHERE t.status = com.academy.entity.enums.PaymentStatus.PENDING " +
           "AND t.reminderCount >= 0 AND t.createdAt < :before ORDER BY t.createdAt")
    java.util.List<UUID> findPendingIdsForReminders(@Param("before") LocalDateTime before);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM PaymentTransaction t JOIN FETCH t.user WHERE t.id = :id")
    Optional<PaymentTransaction> findByIdForUpdate(@Param("id") UUID id);

    /** Another payment by the same customer for the same item (course / ebook), started later (a retry). */
    @Query("SELECT COUNT(t) > 0 FROM PaymentTransaction t WHERE t.user.id = :userId AND t.id <> :id " +
           "AND t.transactionType = :type AND t.referenceId = :refId " +
           "AND t.createdAt > :createdAt")
    boolean existsNewerForItem(@Param("userId") UUID userId, @Param("id") UUID id,
                                          @Param("type") String type, @Param("refId") UUID refId,
                                          @Param("createdAt") LocalDateTime createdAt);

    /** Same, for payments with no item id (subscriptions). */
    @Query("SELECT COUNT(t) > 0 FROM PaymentTransaction t WHERE t.user.id = :userId AND t.id <> :id " +
           "AND t.transactionType = :type " +
           "AND t.createdAt > :createdAt")
    boolean existsNewerOfType(@Param("userId") UUID userId, @Param("id") UUID id,
                                         @Param("type") String type, @Param("createdAt") LocalDateTime createdAt);

    // ── Admin listing filters (server-side, so pagination stays correct) ──────

    Page<PaymentTransaction> findByTransactionTypeOrderByCreatedAtDesc(String transactionType, Pageable pageable);

    Page<PaymentTransaction> findByStatusAndTransactionTypeOrderByCreatedAtDesc(PaymentStatus status,
                                                                              String transactionType,
                                                                              Pageable pageable);

    // ── Admin analytics / dashboard aggregates ────────────────────────────────

    /** Number of transactions in a status AND type since a date (e.g. courses sold this period). */
    @Query("SELECT COUNT(t) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = :type AND t.createdAt >= :since")
    long countByStatusAndTypeSince(@Param("status") PaymentStatus status,
                                   @Param("type") String type,
                                   @Param("since") LocalDateTime since);

    /** Number of transactions in a status AND type (whole dataset). */
    long countByStatusAndTransactionType(PaymentStatus status, String transactionType);

    /** Total amount in a status AND type since a date. */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = :type AND t.createdAt >= :since")
    BigDecimal sumAmountByStatusAndTypeSince(@Param("status") PaymentStatus status,
                                             @Param("type") String type,
                                             @Param("since") LocalDateTime since);

    /** (createdAt, amount) rows in a status since a date - bucketed per day in Java (DB-agnostic). */
    @Query("SELECT t.createdAt, t.amount FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.createdAt >= :since")
    List<Object[]> findCreatedAtAndAmountByStatusSince(@Param("status") PaymentStatus status,
                                                       @Param("since") LocalDateTime since);

    /**
     * Best-selling courses by realised revenue: rows of (courseId, SUM(amount), COUNT(*))
     * over COURSE_PURCHASE transactions in the given status created on/after {@code since},
     * highest revenue first. The Pageable only limits the row count.
     */
    @Query("SELECT t.referenceId, SUM(t.amount), COUNT(t) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = 'COURSE_PURCHASE' " +
           "AND t.referenceId IS NOT NULL AND t.createdAt >= :since " +
           "GROUP BY t.referenceId ORDER BY SUM(t.amount) DESC")
    List<Object[]> findTopCourseRevenueSince(@Param("status") PaymentStatus status,
                                             @Param("since") LocalDateTime since,
                                             Pageable pageable);

    /** Realised revenue of one course (COURSE_PURCHASE rows whose referenceId is the course id). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = 'COURSE_PURCHASE' AND t.referenceId = :courseId")
    BigDecimal sumCourseRevenue(@Param("status") PaymentStatus status,
                                @Param("courseId") UUID courseId);

    /** Realised revenue of every course taught by an instructor (COURSE_PURCHASE rows only). */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t " +
           "WHERE t.status = :status AND t.transactionType = 'COURSE_PURCHASE' " +
           "AND t.referenceId IN (SELECT c.id FROM Course c WHERE c.instructor = :instructor)")
    BigDecimal sumCourseRevenueByInstructor(@Param("status") PaymentStatus status,
                                            @Param("instructor") User instructor);
}
