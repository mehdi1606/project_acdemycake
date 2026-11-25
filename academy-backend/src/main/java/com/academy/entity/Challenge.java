package com.academy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A student cake challenge with its dates (submissions, voting, results). */
@Entity
@Table(name = "challenges")
@Getter
@Setter
@NoArgsConstructor
public class Challenge extends BaseEntity {

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "submissions_open_at", nullable = false)
    private Instant submissionsOpenAt;

    @Column(name = "submissions_close_at", nullable = false)
    private Instant submissionsCloseAt;

    @Column(name = "voting_open_at", nullable = false)
    private Instant votingOpenAt;

    @Column(name = "voting_close_at", nullable = false)
    private Instant votingCloseAt;

    @Column(name = "results_at", nullable = false)
    private Instant resultsAt;

    @Column(name = "banner_until", nullable = false)
    private Instant bannerUntil;

    @Column(name = "min_photos", nullable = false)
    private Integer minPhotos = 3;

    @Column(name = "max_photos", nullable = false)
    private Integer maxPhotos = 5;

    @Column(name = "min_voters", nullable = false)
    private Integer minVoters = 3;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    /** When everyone was told that voting is open (null = not yet). */
    @Column(name = "voting_notified_at")
    private Instant votingNotifiedAt;

    /** When everyone was told the results are out (null = not yet). */
    @Column(name = "results_notified_at")
    private Instant resultsNotifiedAt;

    /** UPCOMING, SUBMISSIONS, BETWEEN, VOTING, TALLYING or RESULTS. */
    public String phaseAt(Instant now) {
        if (now.isBefore(submissionsOpenAt)) return "UPCOMING";
        if (!now.isAfter(submissionsCloseAt)) return "SUBMISSIONS";
        if (now.isBefore(votingOpenAt)) return "BETWEEN";
        if (!now.isAfter(votingCloseAt)) return "VOTING";
        if (now.isBefore(resultsAt)) return "TALLYING";
        return "RESULTS";
    }
}
