package com.academy.service.impl;

import com.academy.dto.response.UserResponse;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Numbers the gemstone badge rules are based on (completed courses, masterclasses,
 * quizzes and average best quiz score). The frontend combines them with the member's
 * join date to pick the badge, so the admin list and the student's own pages agree.
 */
@Service
@RequiredArgsConstructor
public class BadgeStatsService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /** Fill the badge fields on many responses with three grouped queries. */
    @Transactional(readOnly = true)
    public void apply(Collection<UserResponse> responses) {
        List<UUID> ids = responses.stream().map(UserResponse::getId).filter(Objects::nonNull).toList();
        if (ids.isEmpty()) return;

        Map<UUID, Integer> completed = new HashMap<>();
        for (Object[] r : enrollmentRepository.countCompletedByUserIds(ids)) completed.put((UUID) r[0], ((Number) r[1]).intValue());

        Map<UUID, Integer> masterclasses = new HashMap<>();
        for (Object[] r : enrollmentRepository.countMasterclassesByUserIds(ids)) masterclasses.put((UUID) r[0], ((Number) r[1]).intValue());

        Map<UUID, Integer> quizzes = new HashMap<>();
        Map<UUID, Integer> avg = new HashMap<>();
        for (Object[] r : quizAttemptRepository.quizStatsByStudentIds(ids)) {
            UUID id = r[0] instanceof UUID u ? u : UUID.fromString(String.valueOf(r[0]));
            quizzes.put(id, ((Number) r[1]).intValue());
            if (r[2] != null) avg.put(id, (int) Math.round(((Number) r[2]).doubleValue()));
        }

        for (UserResponse u : responses) {
            u.setCompletedCourses(completed.getOrDefault(u.getId(), 0));
            u.setCompletedMasterclasses(masterclasses.getOrDefault(u.getId(), 0));
            u.setQuizzesTaken(quizzes.getOrDefault(u.getId(), 0));
            u.setAvgQuizScore(avg.get(u.getId()));
        }
    }

    public UserResponse apply(UserResponse response) {
        apply(List.of(response));
        return response;
    }
}
