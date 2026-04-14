package com.academy.dto.response;

import com.academy.entity.QuizAttempt;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {

    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private Integer score;
    private Integer totalPoints;
    private Double percentage;
    private Boolean passed;
    private String status;
    private Boolean violated;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    public static QuizAttemptResponse fromEntity(QuizAttempt attempt) {
        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz() != null ? attempt.getQuiz().getId() : null)
                .quizTitle(attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : null)
                .score(attempt.getScore())
                .totalPoints(attempt.getTotalPoints())
                .percentage(attempt.getPercentage())
                .passed(attempt.getPassed())
                .status(attempt.getStatus() != null ? attempt.getStatus().name() : null)
                .violated(attempt.getViolated())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .build();
    }
}
