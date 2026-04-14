package com.academy.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateQuizRequest {

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    // Optional: links this quiz to a specific QUIZ-type lesson
    private UUID lessonId;

    @NotBlank(message = "Quiz title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    private String description;

    @NotNull
    @Min(value = 1, message = "Passing score must be at least 1")
    @Max(value = 100, message = "Passing score cannot exceed 100")
    private Integer passingScore = 70;

    @NotNull
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    private Integer duration = 30;

    private Boolean shuffleQuestions = false;
    private Boolean showCorrectAnswers = true;
    private Boolean allowRetake = true;

    @Min(value = 1)
    @Max(value = 10)
    private Integer maxAttempts = 3;

    @NotEmpty(message = "Quiz must have at least one question")
    @Valid
    private List<QuestionRequest> questions;

    @Data
    public static class QuestionRequest {

        @NotBlank(message = "Question text is required")
        private String text;

        @NotBlank(message = "Question type is required")
        private String type; // MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE

        @NotNull
        @Min(1)
        @Max(100)
        private Integer points = 1;

        private String explanation;

        private Integer orderIndex = 0;

        @NotEmpty(message = "Question must have options")
        @Valid
        private List<OptionRequest> options;
    }

    @Data
    public static class OptionRequest {

        @NotBlank(message = "Option text is required")
        private String text;

        private Boolean isCorrect = false;

        private Integer orderIndex = 0;
    }
}
