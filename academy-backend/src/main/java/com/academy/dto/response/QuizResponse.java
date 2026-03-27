package com.academy.dto.response;

import com.academy.entity.Quiz;
import com.academy.entity.QuizOption;
import com.academy.entity.QuizQuestion;
import com.academy.entity.enums.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {

    private UUID id;
    private UUID courseId;
    private String courseName;
    private String title;
    private String description;
    private Integer passingScore;
    private Integer duration;
    private Boolean shuffleQuestions;
    private Boolean showCorrectAnswers;
    private Boolean allowRetake;
    private Integer maxAttempts;
    private QuizStatus status;
    private Integer questionCount;
    private Integer totalPoints;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionResponse> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private UUID id;
        private String type;
        private String text;
        private Integer points;
        private String explanation;
        private Integer orderIndex;
        private List<OptionResponse> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private UUID id;
        private String text;
        private Boolean isCorrect;
        private Integer orderIndex;
    }

    public static QuizResponse fromEntity(Quiz quiz) {
        List<QuestionResponse> questionResponses = null;
        if (quiz.getQuestions() != null) {
            questionResponses = quiz.getQuestions().stream()
                    .map(q -> QuestionResponse.builder()
                            .id(q.getId())
                            .type(q.getType().name())
                            .text(q.getText())
                            .points(q.getPoints())
                            .explanation(q.getExplanation())
                            .orderIndex(q.getOrderIndex())
                            .options(q.getOptions() != null
                                    ? q.getOptions().stream()
                                            .map(o -> OptionResponse.builder()
                                                    .id(o.getId())
                                                    .text(o.getText())
                                                    .isCorrect(o.getIsCorrect())
                                                    .orderIndex(o.getOrderIndex())
                                                    .build())
                                            .collect(Collectors.toList())
                                    : List.of())
                            .build())
                    .collect(Collectors.toList());
        }

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .courseName(quiz.getCourse().getTitle())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .passingScore(quiz.getPassingScore())
                .duration(quiz.getDuration())
                .shuffleQuestions(quiz.getShuffleQuestions())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .allowRetake(quiz.getAllowRetake())
                .maxAttempts(quiz.getMaxAttempts())
                .status(quiz.getStatus())
                .questionCount(quiz.getQuestionCount())
                .totalPoints(quiz.getTotalPoints())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .questions(questionResponses)
                .build();
    }

    // Student-facing version: questions included but isCorrect is hidden
    public static QuizResponse fromEntityForStudent(Quiz quiz) {
        List<QuestionResponse> questionResponses = null;
        if (quiz.getQuestions() != null) {
            questionResponses = quiz.getQuestions().stream()
                    .map(q -> QuestionResponse.builder()
                            .id(q.getId())
                            .type(q.getType().name())
                            .text(q.getText())
                            .points(q.getPoints())
                            .orderIndex(q.getOrderIndex())
                            // explanation deliberately omitted – shown after answering via checkAnswer
                            .options(q.getOptions() != null
                                    ? q.getOptions().stream()
                                            .map(o -> OptionResponse.builder()
                                                    .id(o.getId())
                                                    .text(o.getText())
                                                    // isCorrect is null – hidden from student
                                                    .orderIndex(o.getOrderIndex())
                                                    .build())
                                            .collect(Collectors.toList())
                                    : List.of())
                            .build())
                    .collect(Collectors.toList());
        }

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .courseName(quiz.getCourse().getTitle())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .passingScore(quiz.getPassingScore())
                .duration(quiz.getDuration())
                .shuffleQuestions(quiz.getShuffleQuestions())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .allowRetake(quiz.getAllowRetake())
                .maxAttempts(quiz.getMaxAttempts())
                .status(quiz.getStatus())
                .questionCount(quiz.getQuestionCount())
                .totalPoints(quiz.getTotalPoints())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .questions(questionResponses)
                .build();
    }

    // Lightweight version without questions (for list views)
    public static QuizResponse fromEntitySummary(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .courseName(quiz.getCourse().getTitle())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .passingScore(quiz.getPassingScore())
                .duration(quiz.getDuration())
                .shuffleQuestions(quiz.getShuffleQuestions())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .allowRetake(quiz.getAllowRetake())
                .maxAttempts(quiz.getMaxAttempts())
                .status(quiz.getStatus())
                .questionCount(quiz.getQuestionCount())
                .totalPoints(quiz.getTotalPoints())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }
}
