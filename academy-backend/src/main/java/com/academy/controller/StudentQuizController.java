package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.QuizResponse;
import com.academy.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
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

    @PostMapping("/{quizId}/start")
    @Operation(summary = "Start a quiz attempt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startAttempt(@PathVariable UUID quizId) {
        Map<String, Object> response = quizService.startAttempt(quizId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
