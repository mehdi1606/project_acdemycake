package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assignment_submissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "student_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_url")
    private String fileUrl;

    private Integer grade;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by")
    private User gradedBy;

    @Column(name = "submitted_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime submittedAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /** 1 for the first submission, 2 after the one allowed resubmission. */
    @Column(name = "attempt_number", nullable = false)
    @Builder.Default
    private Integer attemptNumber = 1;

    /** Mark and feedback of the first attempt, kept when the student resubmits. */
    @Column(name = "previous_grade")
    private Integer previousGrade;

    @Column(name = "previous_feedback", columnDefinition = "TEXT")
    private String previousFeedback;

    public boolean isGraded() {
        return grade != null;
    }

    public boolean isPassed() {
        return assignment != null && assignment.isPassingGrade(grade);
    }

    /** A failing mark on the first attempt reopens the assignment once. */
    public boolean canResubmit() {
        int attempt = attemptNumber != null ? attemptNumber : 1;
        return isGraded() && !isPassed() && attempt < Assignment.MAX_ATTEMPTS;
    }
}
