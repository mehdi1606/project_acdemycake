package com.academy.repository;

import com.academy.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {
    Optional<Challenge> findBySlug(String slug);

    /** The challenge to advertise: active and its banner period not over yet (latest first). */
    Optional<Challenge> findFirstByActiveTrueAndBannerUntilAfterOrderBySubmissionsOpenAtDesc(Instant now);
}
