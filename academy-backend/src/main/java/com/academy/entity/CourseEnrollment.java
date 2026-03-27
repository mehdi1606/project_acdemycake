package com.academy.entity;

import com.academy.entity.enums.EnrollmentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "course_enrollments", indexes = {
        @Index(name = "idx_course_enrollments_user_id", columnList = "user_id"),
        @Index(name = "idx_course_enrollments_course_id", columnList = "course_id"),
        @Index(name = "idx_course_enrollments_enrollment_type", columnList = "enrollment_type"),
        @Index(name = "idx_course_enrollments_expires_at", columnList = "expires_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_enrollment_user_course", columnNames = {"user_id", "course_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseEnrollment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_type", nullable = false, length = 20)
    private EnrollmentType enrollmentType;

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "completed_lessons_json", columnDefinition = "TEXT")
    private String completedLessonsJson;

    @Column(name = "last_accessed_lesson_id")
    private UUID lastAccessedLessonId;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "certificate_id")
    private UUID certificateId;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    public boolean isExpired() {
        if (expiresAt == null) {
            return false;
        }
        return expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isAccessible() {
        return isActive && !isExpired();
    }
}
