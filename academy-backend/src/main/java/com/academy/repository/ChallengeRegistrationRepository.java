package com.academy.repository;

import com.academy.entity.ChallengeRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChallengeRegistrationRepository extends JpaRepository<ChallengeRegistration, UUID> {
    boolean existsByChallengeIdAndUserId(UUID challengeId, UUID userId);

    long countByChallengeId(UUID challengeId);
}
