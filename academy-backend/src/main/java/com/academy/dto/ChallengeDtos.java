package com.academy.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Request and response shapes for the cake challenge. */
public final class ChallengeDtos {
    private ChallengeDtos() {}

    /** Public summary: dates, phase (decided by the server clock) and counters. */
    public record ChallengeView(
            String slug, String phase, Instant serverNow,
            Instant submissionsOpenAt, Instant submissionsCloseAt,
            Instant votingOpenAt, Instant votingCloseAt, Instant resultsAt, Instant bannerUntil,
            int minPhotos, int maxPhotos, int minVoters,
            long registrations, long approvedEntries, long totalVotes, long voters) {}

    /** An approved cake in the public gallery, with its live score. */
    public record EntryCard(
            UUID id, String title, String description, List<String> photos,
            String authorName, String authorAvatar,
            long points, long voters, int rank, boolean eligible, LocalDateTime approvedAt,
            /** Opens the author's member profile. */
            UUID authorId) {}

    /** What the signed-in person can do and what they have done. */
    public record MyStatus(
            boolean registered, boolean emailVerified, String role, boolean canEnter,
            MyEntry entry, List<UUID> votedEntryIds) {}

    public record MyEntry(
            UUID id, String title, String description, List<String> photos,
            boolean certified, boolean publicationConsent,
            String status, String adminNote, LocalDateTime updatedAt) {}

    public record SaveEntryRequest(
            String title, String description, List<String> photos,
            Boolean certified, Boolean publicationConsent) {}

    public record StatusRequest(String status, String note) {}

    public record VoidRequest(Boolean voided, String reason) {}

    /** Admin view of an entry, any status. */
    public record AdminEntry(
            UUID id, String title, String description, List<String> photos,
            boolean certified, boolean publicationConsent,
            String status, String adminNote, LocalDateTime createdAt, LocalDateTime updatedAt,
            UUID userId, String userName, String userEmail, LocalDateTime userCreatedAt,
            long points, long voters, int rank, long flaggedVotes) {}

    /** Admin view of one vote, with the signals that help spot fake accounts. */
    public record AdminVote(
            UUID id, String voterName, String voterEmail, String voterRole, int points,
            LocalDateTime accountCreatedAt, boolean newAccount, boolean emailVerified,
            String ipAddress, long sameIpVotes, boolean voided, String voidedReason,
            LocalDateTime createdAt) {}
}
