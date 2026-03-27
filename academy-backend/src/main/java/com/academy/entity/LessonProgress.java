package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lesson_progress", indexes = {
        @Index(name = "idx_lesson_progress_user_id", columnList = "user_id"),
        @Index(name = "idx_lesson_progress_lesson_id", columnList = "lesson_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_lesson_progress_user_lesson", columnNames = {"user_id", "lesson_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private CourseLesson lesson;

    @Column(name = "watched_duration_seconds")
    @Builder.Default
    private Integer watchedDurationSeconds = 0;

    @Column(name = "total_duration_seconds")
    private Integer totalDurationSeconds;

    @Column(name = "last_position_seconds")
    @Builder.Default
    private Integer lastPositionSeconds = 0;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "first_watched_at")
    private LocalDateTime firstWatchedAt;

    @Column(name = "last_watched_at")
    private LocalDateTime lastWatchedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "watch_count")
    @Builder.Default
    private Integer watchCount = 0;

    public void updateProgress(int positionSeconds, int durationSeconds) {
        this.lastPositionSeconds = positionSeconds;
        this.lastWatchedAt = LocalDateTime.now();

        if (positionSeconds > this.watchedDurationSeconds) {
            this.watchedDurationSeconds = positionSeconds;
        }

        this.totalDurationSeconds = durationSeconds;

        if (this.firstWatchedAt == null) {
            this.firstWatchedAt = LocalDateTime.now();
        }
    }

    public void markComplete() {
        this.isCompleted = true;
        this.completedAt = LocalDateTime.now();
    }
}
