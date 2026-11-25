package com.academy.repository;

import com.academy.entity.ChallengeVote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeVoteRepository extends JpaRepository<ChallengeVote, UUID> {
    Optional<ChallengeVote> findByEntryIdAndVoterId(UUID entryId, UUID voterId);

    @EntityGraph(attributePaths = "voter")
    List<ChallengeVote> findByEntryIdOrderByCreatedAtDesc(UUID entryId);

    /** Rows of [entryId, points, voters] for every counted (not voided) vote in a challenge. */
    @Query("select v.entry.id, coalesce(sum(v.points), 0), count(v) from ChallengeVote v " +
           "where v.entry.challenge.id = :challengeId and v.voided = false group by v.entry.id")
    List<Object[]> tally(@Param("challengeId") UUID challengeId);

    @Query("select v.entry.id from ChallengeVote v " +
           "where v.voter.id = :voterId and v.entry.challenge.id = :challengeId and v.voided = false")
    List<UUID> votedEntryIds(@Param("voterId") UUID voterId, @Param("challengeId") UUID challengeId);
}
