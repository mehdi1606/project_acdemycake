package com.academy.repository;

import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmailVerificationToken(String token);

    Optional<User> findByPasswordResetToken(String token);

    List<User> findByRole(UserRole role);

    Page<User> findByRole(UserRole role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.subscriptionStatus = :status AND u.subscriptionEndDate < :date")
    List<User> findExpiredSubscriptions(
            @Param("status") SubscriptionStatus status,
            @Param("date") LocalDateTime date
    );

    @Query("SELECT u FROM User u WHERE u.subscriptionStatus = 'ACTIVE' AND u.subscriptionEndDate BETWEEN :start AND :end")
    List<User> findSubscriptionsExpiringBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Modifying
    @Query("UPDATE User u SET u.subscriptionStatus = :status WHERE u.id = :userId")
    void updateSubscriptionStatus(@Param("userId") UUID userId, @Param("status") SubscriptionStatus status);

    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.subscriptionStatus = 'ACTIVE'")
    long countActiveSubscriptions();

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countNewUsersSince(@Param("since") LocalDateTime since);
}
