package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.QuizAttemptResponse;
import com.academy.dto.response.QuizResponse;
import com.academy.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@Tag(name = "Student Quiz", description = "Student quiz endpoints")
public class StudentQuizController {

    private final QuizService quizService;

    @GetMapping
    @Operation(summary = "Get all published quizzes for enrolled courses")
    public ResponseEntity<ApiResponse<PageResponse<QuizResponse>>> getMyQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<QuizResponse> response = quizService.getStudentQuizzes(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{quizId}")
    @Operation(summary = "Get a specific quiz for taking (correct answers hidden)")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizForStudent(@PathVariable UUID quizId) {
        QuizResponse response = quizService.getQuizForStudent(quizId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/lesson/{lessonId}")
    @Operation(summary = "Get the quiz linked to a specific lesson (student view)")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizByLesson(@PathVariable UUID lessonId) {
        Optional<QuizResponse> quiz = quizService.getQuizByLessonId(lessonId, true);
        return quiz.map(q -> ResponseEntity.ok(ApiResponse.success(q)))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping("/{quizId}/start")
    @Operation(summary = "Start a quiz attempt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startAttempt(@PathVariable UUID quizId) {
        Map<String, Object> response = quizService.startAttempt(quizId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{quizId}/my-attempts")
    @Operation(summary = "Get all my attempts for a specific quiz")
    public ResponseEntity<ApiResponse<List<QuizAttemptResponse>>> getMyAttempts(@PathVariable UUID quizId) {
        List<QuizAttemptResponse> attempts = quizService.getMyQuizAttempts(quizId);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }
}
