package com.academy.service;

import com.academy.dto.request.CreateQuizRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.QuizResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface QuizService {

    // ── Instructor ────────────────────────────────────────────────────────────

    PageResponse<QuizResponse> getMyQuizzes(int page, int size);

    QuizResponse getQuizById(UUID quizId);

    QuizResponse createQuiz(CreateQuizRequest request);

    QuizResponse updateQuiz(UUID quizId, CreateQuizRequest request);

    void deleteQuiz(UUID quizId);

    PageResponse<Object> getQuizAttempts(UUID quizId, int page, int size);

    QuizResponse publishQuiz(UUID quizId);

    QuizResponse unpublishQuiz(UUID quizId);

    // ── Student – browse ──────────────────────────────────────────────────────

    PageResponse<QuizResponse> getStudentQuizzes(int page, int size);

    // ── Student – quiz taking ─────────────────────────────────────────────────

    /** Returns quiz with questions but with isCorrect hidden (null) */
    QuizResponse getQuizForStudent(UUID quizId);

    /** Creates a new attempt; returns {attemptId, startedAt, endsAt} */
    Map<String, Object> startAttempt(UUID quizId);

    /** Checks a single answer; returns {correct, correctOptionIds, explanation} */
    Map<String, Object> checkAnswer(UUID attemptId, UUID questionId, List<UUID> selectedOptionIds);

    /** Grades and saves the attempt; returns {score, totalPoints, percentage, passed, violated} */
    Map<String, Object> submitAttempt(UUID attemptId, List<Map<String, Object>> answers, boolean violated);
}
