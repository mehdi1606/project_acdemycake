package com.academy.service.impl;

import com.academy.dto.request.CreateQuizRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.QuizAttemptResponse;
import com.academy.dto.response.QuizResponse;
import com.academy.entity.*;
import com.academy.entity.enums.AttemptStatus;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.QuestionType;
import com.academy.entity.enums.QuizStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseLessonRepository;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.repository.QuizAttemptRepository;
import com.academy.repository.QuizRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.EnrollmentService;
import com.academy.service.QuizService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Comparator;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentService enrollmentService;
    private final UserService userService;

    // ── Instructor ────────────────────────────────────────────────────────────

    @Override
    public PageResponse<QuizResponse> getMyQuizzes(int page, int size) {
        User instructor = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Quiz> quizzes = quizRepository.findByInstructor(instructor, pageRequest);
        return PageResponse.from(quizzes, QuizResponse::fromEntitySummary);
    }

    @Override
    public QuizResponse getQuizById(UUID quizId) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }
        return QuizResponse.fromEntity(quiz);
    }

    @Override
    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request) {
        User instructor = getCurrentUser();

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this course");
        }

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new BadRequestException("You can only create quizzes for published courses");
        }

        Quiz quiz = Quiz.builder()
                .course(course)
                .instructor(instructor)
                .title(request.getTitle())
                .description(request.getDescription())
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 70)
                .duration(request.getDuration() != null ? request.getDuration() : 30)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .showCorrectAnswers(request.getShowCorrectAnswers() != null ? request.getShowCorrectAnswers() : true)
                .allowRetake(request.getAllowRetake() != null ? request.getAllowRetake() : true)
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 3)
                .lessonId(request.getLessonId())
                .status(QuizStatus.DRAFT)
                .questions(new ArrayList<>())
                .build();

        if (request.getQuestions() != null) {
            for (CreateQuizRequest.QuestionRequest qReq : request.getQuestions()) {
                QuestionType questionType;
                try {
                    questionType = QuestionType.valueOf(qReq.getType().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid question type: " + qReq.getType());
                }

                QuizQuestion question = QuizQuestion.builder()
                        .quiz(quiz)
                        .type(questionType)
                        .text(qReq.getText())
                        .points(qReq.getPoints() != null ? qReq.getPoints() : 1)
                        .explanation(qReq.getExplanation())
                        .orderIndex(qReq.getOrderIndex() != null ? qReq.getOrderIndex() : 0)
                        .options(new ArrayList<>())
                        .build();

                if (qReq.getOptions() != null) {
                    for (CreateQuizRequest.OptionRequest oReq : qReq.getOptions()) {
                        QuizOption option = QuizOption.builder()
                                .question(question)
                                .text(oReq.getText())
                                .isCorrect(oReq.getIsCorrect() != null ? oReq.getIsCorrect() : false)
                                .orderIndex(oReq.getOrderIndex() != null ? oReq.getOrderIndex() : 0)
                                .build();
                        question.getOptions().add(option);
                    }
                }
                quiz.getQuestions().add(question);
            }
        }

        Quiz saved = quizRepository.save(quiz);
        log.info("Quiz created: {} for course: {}", saved.getId(), course.getId());
        return QuizResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public QuizResponse updateQuiz(UUID quizId, CreateQuizRequest request) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 70);
        quiz.setDuration(request.getDuration() != null ? request.getDuration() : 30);
        quiz.setShuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false);
        quiz.setShowCorrectAnswers(request.getShowCorrectAnswers() != null ? request.getShowCorrectAnswers() : true);
        quiz.setAllowRetake(request.getAllowRetake() != null ? request.getAllowRetake() : true);
        quiz.setMaxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 3);
        if (request.getLessonId() != null) quiz.setLessonId(request.getLessonId());
        
        quiz.getQuestions().clear();
        
        if (request.getQuestions() != null) {
            for (CreateQuizRequest.QuestionRequest qReq : request.getQuestions()) {
                QuestionType questionType;
                try {
                    questionType = QuestionType.valueOf(qReq.getType().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid question type: " + qReq.getType());
                }

                QuizQuestion question = QuizQuestion.builder()
                        .quiz(quiz)
                        .type(questionType)
                        .text(qReq.getText())
                        .points(qReq.getPoints() != null ? qReq.getPoints() : 1)
                        .explanation(qReq.getExplanation())
                        .orderIndex(qReq.getOrderIndex() != null ? qReq.getOrderIndex() : 0)
                        .options(new ArrayList<>())
                        .build();

                if (qReq.getOptions() != null) {
                    for (CreateQuizRequest.OptionRequest oReq : qReq.getOptions()) {
                        QuizOption option = QuizOption.builder()
                                .question(question)
                                .text(oReq.getText())
                                .isCorrect(oReq.getIsCorrect() != null ? oReq.getIsCorrect() : false)
                                .orderIndex(oReq.getOrderIndex() != null ? oReq.getOrderIndex() : 0)
                                .build();
                        question.getOptions().add(option);
                    }
                }
                quiz.getQuestions().add(question);
            }
        }

        Quiz saved = quizRepository.save(quiz);
        log.info("Quiz updated: {}", saved.getId());
        return QuizResponse.fromEntity(saved);
    }

    @Override
    public PageResponse<Object> getQuizAttempts(UUID quizId, int page, int size) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(quiz, pageRequest);
        
        return PageResponse.from(attempts, a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("studentName", a.getStudent() != null ? a.getStudent().getFullName() : "Unknown");
            map.put("studentEmail", a.getStudent() != null ? a.getStudent().getEmail() : "Unknown");
            map.put("status", a.getStatus().name());
            map.put("score", a.getScore());
            map.put("totalPoints", a.getTotalPoints());
            map.put("percentage", a.getPercentage());
            map.put("passed", a.getPassed());
            map.put("violated", a.getViolated());
            map.put("startedAt", a.getStartedAt());
            map.put("submittedAt", a.getSubmittedAt());
            return map;
        });
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID quizId) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }
        quizRepository.delete(quiz);
        log.info("Quiz deleted: {}", quizId);
    }

    @Override
    @Transactional
    public QuizResponse publishQuiz(UUID quizId) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }
        if (quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Cannot publish a quiz with no questions");
        }
        quiz.setStatus(QuizStatus.PUBLISHED);
        return QuizResponse.fromEntitySummary(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public QuizResponse unpublishQuiz(UUID quizId) {
        User instructor = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        if (!quiz.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this quiz");
        }
        quiz.setStatus(QuizStatus.DRAFT);
        return QuizResponse.fromEntitySummary(quizRepository.save(quiz));
    }

    // ── Student – browse ──────────────────────────────────────────────────────

    @Override
    public PageResponse<QuizResponse> getStudentQuizzes(int page, int size) {
        User student = getCurrentUser();
        List<Course> enrolledCourses = courseEnrollmentRepository.findByUser(student)
                .stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsActive()))
                .map(CourseEnrollment::getCourse)
                .collect(Collectors.toList());

        if (enrolledCourses.isEmpty()) {
            return PageResponse.<QuizResponse>builder()
                    .content(List.of())
                    .page(page).size(size)
                    .totalElements(0).totalPages(0)
                    .first(true).last(true)
                    .hasNext(false).hasPrevious(false)
                    .build();
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Quiz> quizzes = quizRepository.findByCourseInAndStatus(enrolledCourses, QuizStatus.PUBLISHED, pageRequest);
        return PageResponse.from(quizzes, QuizResponse::fromEntitySummary);
    }

    // ── Student – quiz taking ─────────────────────────────────────────────────

    @Override
    public QuizResponse getQuizForStudent(UUID quizId) {
        Quiz quiz = findQuizById(quizId);
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("This quiz is not available");
        }
        return QuizResponse.fromEntityForStudent(quiz);
    }

    @Override
    @Transactional
    public Map<String, Object> startAttempt(UUID quizId) {
        User student = getCurrentUser();
        Quiz quiz = findQuizById(quizId);

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("This quiz is not available");
        }

        long attemptCount = quizAttemptRepository.countByQuizAndStudent(quiz, student);
        if (!Boolean.TRUE.equals(quiz.getAllowRetake()) && attemptCount > 0) {
            throw new BadRequestException("You have already attempted this quiz and retakes are not allowed");
        }
        if (Boolean.TRUE.equals(quiz.getAllowRetake()) && attemptCount >= quiz.getMaxAttempts()) {
            throw new BadRequestException("You have reached the maximum number of attempts (" + quiz.getMaxAttempts() + ")");
        }

        // ── Prerequisite check: if quiz is linked to a lesson, verify all
        //    earlier lessons in the same module are completed before allowing start ──
        if (quiz.getLessonId() != null) {
            courseLessonRepository.findById(quiz.getLessonId()).ifPresent(quizLesson -> {
                var module = quizLesson.getModule();
                if (module != null && module.getLessons() != null) {
                    List<CourseLesson> ordered = new ArrayList<>(module.getLessons());
                    ordered.sort(Comparator.comparingInt(l -> l.getOrderIndex() != null ? l.getOrderIndex() : 0));
                    for (CourseLesson lesson : ordered) {
                        if (lesson.getId().equals(quizLesson.getId())) break; // reached the quiz lesson — stop
                        // Only require non-QUIZ lessons to be completed
                        if (lesson.getContentType() != com.academy.entity.enums.ContentType.QUIZ) {
                            boolean completed = lessonProgressRepository
                                    .findByUserAndLesson(student, lesson)
                                    .map(lp -> Boolean.TRUE.equals(lp.getIsCompleted()))
                                    .orElse(false);
                            if (!completed) {
                                throw new ForbiddenException(
                                        "Please complete all lessons in this module before taking the quiz.");
                            }
                        }
                    }
                }
            });
        }

        LocalDateTime now = LocalDateTime.now();
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .startedAt(now)
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        LocalDateTime endsAt = now.plusMinutes(quiz.getDuration());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attemptId", saved.getId().toString());
        result.put("startedAt", now.toString());
        result.put("endsAt", endsAt.toString());
        return result;
    }

    @Override
    public Map<String, Object> checkAnswer(UUID attemptId, UUID questionId, List<UUID> selectedOptionIds) {
        User student = getCurrentUser();

        QuizAttempt attempt = quizAttemptRepository.findByIdAndStudent(attemptId, student)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new BadRequestException("This attempt has already been submitted");
        }

        Quiz quiz = findQuizById(attempt.getQuiz().getId());

        QuizQuestion question = quiz.getQuestions().stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Question not found in this quiz"));

        List<UUID> correctOptionIds = question.getOptions().stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .map(QuizOption::getId)
                .collect(Collectors.toList());

        Set<UUID> correctSet = new HashSet<>(correctOptionIds);
        Set<UUID> selectedSet = new HashSet<>(selectedOptionIds != null ? selectedOptionIds : List.of());
        boolean isCorrect = correctSet.equals(selectedSet);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("correct", isCorrect);
        result.put("correctOptionIds", correctOptionIds.stream().map(UUID::toString).collect(Collectors.toList()));
        result.put("explanation", question.getExplanation());
        return result;
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> submitAttempt(UUID attemptId, List<Map<String, Object>> answers, boolean violated) {
        User student = getCurrentUser();

        QuizAttempt attempt = quizAttemptRepository.findByIdAndStudent(attemptId, student)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new BadRequestException("This attempt has already been submitted");
        }

        Quiz quiz = findQuizById(attempt.getQuiz().getId());
        int totalPoints = quiz.getTotalPoints();
        int score = 0;

        if (!violated && answers != null && !answers.isEmpty()) {
            for (Map<String, Object> answerMap : answers) {
                String qIdStr = (String) answerMap.get("questionId");
                List<String> selIds = (List<String>) answerMap.get("selectedOptionIds");
                if (qIdStr == null || selIds == null) continue;

                UUID qId;
                try { qId = UUID.fromString(qIdStr); }
                catch (IllegalArgumentException e) { continue; }

                List<UUID> selectedUUIDs = selIds.stream()
                        .map(s -> { try { return UUID.fromString(s); } catch (Exception ex) { return null; } })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

                QuizQuestion question = quiz.getQuestions().stream()
                        .filter(q -> q.getId().equals(qId))
                        .findFirst().orElse(null);
                if (question == null) continue;

                List<UUID> correctIds = question.getOptions().stream()
                        .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                        .map(QuizOption::getId)
                        .collect(Collectors.toList());

                if (new HashSet<>(correctIds).equals(new HashSet<>(selectedUUIDs))) {
                    score += question.getPoints();
                }
            }
        }

        double percentage = totalPoints > 0 ? (double) score / totalPoints * 100.0 : 0.0;
        double roundedPct = Math.round(percentage * 10.0) / 10.0;
        boolean passed = !violated && percentage >= quiz.getPassingScore();

        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setScore(score);
        attempt.setTotalPoints(totalPoints);
        attempt.setPercentage(roundedPct);
        attempt.setPassed(passed);
        attempt.setViolated(violated);
        attempt.setSubmittedAt(LocalDateTime.now());
        quizAttemptRepository.save(attempt);

        log.info("Attempt {} submitted: {}/{} pts ({}%) passed={} violated={}", attemptId, score, totalPoints, roundedPct, passed, violated);

        // Auto-complete the linked QUIZ lesson when student passes, then update enrollment progress
        if (passed && quiz.getLessonId() != null) {
            try {
                courseLessonRepository.findById(quiz.getLessonId()).ifPresent(lesson -> {
                    LessonProgress progress = lessonProgressRepository
                            .findByUserAndLesson(student, lesson)
                            .orElseGet(() -> LessonProgress.builder()
                                    .user(student)
                                    .lesson(lesson)
                                    .build());
                    if (!Boolean.TRUE.equals(progress.getIsCompleted())) {
                        progress.markComplete();
                        lessonProgressRepository.save(progress);
                        log.info("Auto-completed lesson {} for student {} via quiz pass", lesson.getId(), student.getId());
                    }
                    // Recalculate enrollment progress % so My Courses card reflects 100%
                    try {
                        Course course = lesson.getModule().getCourse();
                        if (course != null) {
                            courseEnrollmentRepository.findByUserAndCourse(student, course)
                                    .ifPresent(enrollment -> enrollmentService.updateProgress(enrollment.getId()));
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to update enrollment progress after quiz pass: {}", ex.getMessage());
                    }
                });
            } catch (Exception e) {
                log.warn("Failed to auto-complete lesson for quiz {}: {}", quiz.getId(), e.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("totalPoints", totalPoints);
        result.put("percentage", roundedPct);
        result.put("passed", passed);
        result.put("violated", violated);
        return result;
    }

    // ── Lesson-linked quiz lookup ─────────────────────────────────────────────

    @Override
    public Optional<QuizResponse> getQuizByLessonId(UUID lessonId, boolean forStudent) {
        return quizRepository.findByLessonId(lessonId)
                .map(quiz -> forStudent
                        ? QuizResponse.fromEntitySummary(quiz)
                        : QuizResponse.fromEntitySummary(quiz));
    }

    // ── Student: my attempts ─────────────────────────────────────────────────

    @Override
    public List<QuizAttemptResponse> getMyQuizAttempts(UUID quizId) {
        User student = getCurrentUser();
        Quiz quiz = findQuizById(quizId);
        return quizAttemptRepository
                .findByQuizAndStudentOrderByCreatedAtDesc(quiz, student)
                .stream()
                .map(QuizAttemptResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Quiz findQuizById(UUID id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
    }

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
