package com.academy.service.impl;

import com.academy.dto.response.AssignmentRequirementResponse;
import com.academy.entity.Assignment;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.enums.QuizStatus;
import com.academy.repository.CourseLessonRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.repository.QuizAttemptRepository;
import com.academy.repository.QuizRepository;
import com.academy.service.AssignmentRequirementsService;
import com.academy.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentRequirementsServiceImpl implements AssignmentRequirementsService {

    private final EnrollmentService enrollmentService;
    private final CourseLessonRepository courseLessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Override
    public List<AssignmentRequirementResponse> missingFor(User student, Assignment assignment) {
        List<AssignmentRequirementResponse> missing = new ArrayList<>();
        for (Course course : assignment.linkedCourses()) {
            boolean access = enrollmentService.hasAccess(student, course);
            long total = courseLessonRepository.countByCourse(course);
            long done = lessonProgressRepository.countCompletedLessonsByUserAndCourse(student, course);
            long lessonsLeft = Math.max(0, total - done);
            long quizzesLeft = quizRepository.findByCourseAndStatus(course, QuizStatus.PUBLISHED).stream()
                    .filter(q -> !quizAttemptRepository.hasPassed(q, student))
                    .count();

            if (!access || lessonsLeft > 0 || quizzesLeft > 0) {
                missing.add(AssignmentRequirementResponse.builder()
                        .courseId(course.getId())
                        .courseTitle(course.getTitleEn() != null && !course.getTitleEn().isBlank()
                                ? course.getTitleEn() : course.getTitle())
                        .courseTitleAr(course.getTitleAr())
                        .courseSlug(course.getSlug())
                        .noAccess(!access)
                        .lessonsLeft(lessonsLeft)
                        .quizzesLeft(quizzesLeft)
                        .build());
            }
        }
        return missing;
    }
}
