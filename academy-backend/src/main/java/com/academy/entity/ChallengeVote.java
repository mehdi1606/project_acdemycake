package com.academy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One account's vote for one cake. Points are fixed when the vote is cast (student 1, staff 10). */
@Entity
@Table(name = "challenge_votes")
@Getter
@Setter
@NoArgsConstructor
public class ChallengeVote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private ChallengeEntry entry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    @Column(name = "points", nullable = false)
    private Integer points;

    @Column(name = "voter_role", nullable = false, length = 20)
    private String voterRole;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "voided", nullable = false)
    private Boolean voided = false;

    @Column(name = "voided_reason", length = 300)
    private String voidedReason;
}
