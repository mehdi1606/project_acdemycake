package com.academy.entity;

import com.academy.entity.enums.QuizStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes", indexes = {
        @Index(name = "idx_quizzes_course_id", columnList = "course_id"),
        @Index(name = "idx_quizzes_instructor_id", columnList = "instructor_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "passing_score", nullable = false)
    @Builder.Default
    private Integer passingScore = 70;

    @Column(name = "duration", nullable = false)
    @Builder.Default
    private Integer duration = 30; // in minutes

    @Column(name = "shuffle_questions")
    @Builder.Default
    private Boolean shuffleQuestions = false;

    @Column(name = "show_correct_answers")
    @Builder.Default
    private Boolean showCorrectAnswers = true;

    @Column(name = "allow_retake")
    @Builder.Default
    private Boolean allowRetake = true;

    @Column(name = "max_attempts")
    @Builder.Default
    private Integer maxAttempts = 3;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private QuizStatus status = QuizStatus.DRAFT;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<QuizQuestion> questions = new ArrayList<>();

    // Helper methods
    public int getQuestionCount() {
        return questions != null ? questions.size() : 0;
    }

    public int getTotalPoints() {
        if (questions == null) return 0;
        return questions.stream().mapToInt(q -> q.getPoints() != null ? q.getPoints() : 0).sum();
    }
}
