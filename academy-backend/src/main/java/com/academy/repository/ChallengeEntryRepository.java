package com.academy.repository;

import com.academy.entity.ChallengeEntry;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeEntryRepository extends JpaRepository<ChallengeEntry, UUID> {
    Optional<ChallengeEntry> findByChallengeIdAndUserId(UUID challengeId, UUID userId);

    @EntityGraph(attributePaths = "user")
    List<ChallengeEntry> findByChallengeIdAndStatus(UUID challengeId, String status);

    @EntityGraph(attributePaths = "user")
    List<ChallengeEntry> findByChallengeIdOrderByCreatedAtAsc(UUID challengeId);

    long countByChallengeIdAndStatus(UUID challengeId, String status);
}
