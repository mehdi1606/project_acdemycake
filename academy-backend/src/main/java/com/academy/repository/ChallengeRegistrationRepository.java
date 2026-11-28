package com.academy.repository;

import com.academy.entity.ChallengeRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChallengeRegistrationRepository extends JpaRepository<ChallengeRegistration, UUID> {
    boolean existsByChallengeIdAndUserId(UUID challengeId, UUID userId);

    long countByChallengeId(UUID challengeId);

    /** Everyone registered, oldest first, with the member loaded (admin list). */
    @org.springframework.data.jpa.repository.Query("SELECT r FROM ChallengeRegistration r JOIN FETCH r.user WHERE r.challenge.id = :challengeId ORDER BY r.createdAt ASC")
    java.util.List<ChallengeRegistration> findAllForAdmin(@org.springframework.data.repository.query.Param("challengeId") UUID challengeId);
}
