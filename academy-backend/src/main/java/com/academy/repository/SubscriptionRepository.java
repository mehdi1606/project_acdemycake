package com.academy.repository;

import com.academy.entity.Subscription;
import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
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
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserAndStatus(User user, SubscriptionStatus status);

    List<Subscription> findByUser(User user);

    Page<Subscription> findByUser(User user, Pageable pageable);

    Optional<Subscription> findTopByUserOrderByCreatedAtDesc(User user);

    Optional<Subscription> findByPayzoneTransactionId(String transactionId);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.currentPeriodEnd < :date")
    List<Subscription> findExpiredActiveSubscriptions(@Param("date") LocalDateTime date);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.currentPeriodEnd BETWEEN :start AND :end")
    List<Subscription> findSubscriptionsExpiringBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countActiveSubscriptions();

    @Query("SELECT SUM(s.amount) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.createdAt >= :since")
    BigDecimal sumRevenueFromSubscriptionsSince(@Param("since") LocalDateTime since);

    @Query("SELECT SUM(s.amount) FROM Subscription s WHERE s.status = 'ACTIVE'")
    BigDecimal sumTotalSubscriptionRevenue();
}
