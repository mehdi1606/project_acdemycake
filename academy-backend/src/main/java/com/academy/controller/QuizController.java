package com.academy.controller;

import com.academy.dto.request.CreateQuizRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.QuizResponse;
import com.academy.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/instructor/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
@Tag(name = "Quiz", description = "Instructor quiz management endpoints")
public class QuizController {

    private final QuizService quizService;

    @GetMapping
    @Operation(summary = "Get all quizzes for the current instructor")
    public ResponseEntity<ApiResponse<PageResponse<QuizResponse>>> getMyQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<QuizResponse> response = quizService.getMyQuizzes(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single quiz with all questions")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(@PathVariable UUID id) {
        QuizResponse response = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @Valid @RequestBody CreateQuizRequest request) {
        QuizResponse response = quizService.createQuiz(request);
        return ResponseEntity.ok(ApiResponse.success("Quiz created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable UUID id,
            @Valid @RequestBody CreateQuizRequest request) {
        QuizResponse response = quizService.updateQuiz(id, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a quiz")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable UUID id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully", null));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish a quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> publishQuiz(@PathVariable UUID id) {
        QuizResponse response = quizService.publishQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz published", response));
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish a quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> unpublishQuiz(@PathVariable UUID id) {
        QuizResponse response = quizService.unpublishQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz unpublished", response));
    }

    @GetMapping("/lesson/{lessonId}")
    @Operation(summary = "Get the quiz linked to a specific lesson")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizByLesson(@PathVariable UUID lessonId) {
        Optional<QuizResponse> quiz = quizService.getQuizByLessonId(lessonId, false);
        return quiz.map(q -> ResponseEntity.ok(ApiResponse.success(q)))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @GetMapping("/{id}/attempts")
    @Operation(summary = "Get attempts for a quiz")
    public ResponseEntity<ApiResponse<PageResponse<Object>>> getQuizAttempts(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<Object> response = quizService.getQuizAttempts(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
