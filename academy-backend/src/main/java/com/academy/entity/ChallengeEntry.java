package com.academy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/** One student's cake for a challenge. Photos are stored as a JSON array of file URLs. */
@Entity
@Table(name = "challenge_entries")
@Getter
@Setter
@NoArgsConstructor
public class ChallengeEntry extends BaseEntity {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String CHANGES_REQUESTED = "CHANGES_REQUESTED";
    public static final String REJECTED = "REJECTED";
    public static final String DISQUALIFIED = "DISQUALIFIED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "photos_json", nullable = false, columnDefinition = "TEXT")
    private String photosJson;

    @Column(name = "certified", nullable = false)
    private Boolean certified = false;

    @Column(name = "publication_consent", nullable = false)
    private Boolean publicationConsent = false;

    @Column(name = "status", nullable = false, length = 30)
    private String status = PENDING;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;
}
