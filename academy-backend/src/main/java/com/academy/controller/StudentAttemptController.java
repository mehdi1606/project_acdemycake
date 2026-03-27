package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/student/attempts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student Quiz Attempt", description = "Student quiz attempt endpoints")
public class StudentAttemptController {

    private final QuizService quizService;

    @PostMapping("/{attemptId}/check")
    @Operation(summary = "Check a single answer and receive instant feedback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAnswer(
            @PathVariable UUID attemptId,
            @RequestBody CheckAnswerRequest request) {

        List<UUID> selectedUUIDs = request.getSelectedOptionIds() == null ? List.of() :
                request.getSelectedOptionIds().stream()
                        .map(s -> { try { return UUID.fromString(s); } catch (Exception e) { return null; } })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

        Map<String, Object> result = quizService.checkAnswer(
                attemptId,
                UUID.fromString(request.getQuestionId()),
                selectedUUIDs
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{attemptId}/submit")
    @Operation(summary = "Submit quiz and receive overall result")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAttempt(
            @PathVariable UUID attemptId,
            @RequestBody SubmitAttemptRequest request) {

        // Convert request answers into the format expected by the service
        List<Map<String, Object>> answers = request.getAnswers() == null ? List.of() :
                request.getAnswers().stream()
                        .map(a -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("questionId", a.getQuestionId());
                            m.put("selectedOptionIds", a.getSelectedOptionIds());
                            return m;
                        })
                        .collect(Collectors.toList());

        Map<String, Object> result = quizService.submitAttempt(attemptId, answers, request.isViolated());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckAnswerRequest {
        private String questionId;
        private List<String> selectedOptionIds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitAttemptRequest {
        private List<AnswerDto> answers;
        private boolean violated;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AnswerDto {
            private String questionId;
            private List<String> selectedOptionIds;
        }
    }
}
