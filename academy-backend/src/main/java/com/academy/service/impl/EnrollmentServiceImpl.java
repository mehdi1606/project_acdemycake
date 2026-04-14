package com.academy.service.impl;

import com.academy.dto.response.EnrollmentResponse;
import com.academy.dto.response.InstructorStudentDetailResponse;
import com.academy.dto.response.InstructorStudentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.User;
import com.academy.entity.enums.EnrollmentType;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CertificateService;
import com.academy.service.CourseService;
import com.academy.service.EmailService;
import com.academy.service.EnrollmentService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentServiceImpl implements EnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseService courseService;
    private final UserService userService;
    private final EmailService emailService;

    // @Lazy to avoid potential circular dependency; injected after construction
    @Autowired @Lazy
    private CertificateService certificateService;

    @Override
    public boolean isEnrolled(User user, Course course) {
        return enrollmentRepository.existsByUserAndCourse(user, course);
    }

    @Override
    public boolean hasAccess(User user, Course course) {
        if (course.getIsBeginner() && user.hasActiveSubscription()) {
            return true;
        }

        return enrollmentRepository.findByUserAndCourse(user, course)
                .map(CourseEnrollment::isAccessible)
                .orElse(false);
    }

    @Override
    public CourseEnrollment getEnrollment(User user, Course course) {
        return enrollmentRepository.findByUserAndCourse(user, course)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
    }

    @Override
    @Transactional
    public EnrollmentResponse enrollUser(UUID courseId) {
        User user = getCurrentUser();
        Course course = courseService.findById(courseId);

        if (isEnrolled(user, course)) {
            throw new BadRequestException("You are already enrolled in this course");
        }

        if (course.getIsBeginner()) {
            if (!user.hasActiveSubscription()) {
                throw new ForbiddenException("Active subscription required for beginner courses");
            }
            return EnrollmentResponse.fromEntity(
                    createEnrollment(user, course, EnrollmentType.SUBSCRIPTION, user.getSubscriptionEndDate())
            );
        }

        if (course.getRequiresPurchase()) {
            throw new ForbiddenException("This course requires purchase. Please buy it first.");
        }

        return EnrollmentResponse.fromEntity(
                createEnrollment(user, course, EnrollmentType.FREE, null)
        );
    }

    @Override
    @Transactional
    public void enrollUserInCourse(User user, Course course, EnrollmentType type) {
        if (isEnrolled(user, course)) {
            log.info("User {} already enrolled in course {}", user.getEmail(), course.getTitle());
            return;
        }

        LocalDateTime expiresAt = type == EnrollmentType.SUBSCRIPTION ? user.getSubscriptionEndDate() : null;
        createEnrollment(user, course, type, expiresAt);
    }

    @Override
    @Transactional
    public void enrollUserInCourse(User user, Course course, boolean isPurchase) {
        EnrollmentType type = isPurchase ? EnrollmentType.PURCHASE : EnrollmentType.FREE;
        enrollUserInCourse(user, course, type);
    }

    @Override
    public boolean isUserEnrolled(User user, Course course) {
        return isEnrolled(user, course);
    }

    @Override
    @Transactional
    public void revokeEnrollment(User user, Course course) {
        CourseEnrollment enrollment = enrollmentRepository.findByUserAndCourse(user, course)
                .orElse(null);

        if (enrollment != null) {
            enrollment.setIsActive(false);
            enrollmentRepository.save(enrollment);

            course.decrementEnrollmentCount();
            courseRepository.save(course);

            log.info("Enrollment revoked for user: {} course: {}", user.getEmail(), course.getTitle());
        }
    }

    @Override
    @Transactional
    public void enrollUserInAllBeginnerCourses(User user) {
        List<Course> beginnerCourses = courseRepository.findAllPublishedBeginnerCourses();

        for (Course course : beginnerCourses) {
            if (!isEnrolled(user, course)) {
                createEnrollment(user, course, EnrollmentType.SUBSCRIPTION, user.getSubscriptionEndDate());
            }
        }

        log.info("Enrolled user {} in {} beginner courses", user.getEmail(), beginnerCourses.size());
    }

    @Override
    @Transactional
    public void deactivateSubscriptionEnrollments(User user) {
        enrollmentRepository.deactivateSubscriptionEnrollments(user);
        log.info("Deactivated subscription enrollments for user: {}", user.getEmail());
    }

    @Override
    public PageResponse<EnrollmentResponse> getMyEnrollments(int page, int size) {
        User user = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "enrolledAt"));
        Page<CourseEnrollment> enrollments = enrollmentRepository.findByUserAndIsActiveTrue(user, pageRequest);
        return PageResponse.from(enrollments, enrollment -> buildEnrollmentResponseWithLiveProgress(enrollment, user));
    }

    /**
     * Builds an EnrollmentResponse with progress computed live from LessonProgress records
     * instead of the potentially stale cached values in CourseEnrollment.
     */
    private EnrollmentResponse buildEnrollmentResponseWithLiveProgress(CourseEnrollment enrollment, User user) {
        EnrollmentResponse response = EnrollmentResponse.fromEntity(enrollment);
        try {
            Course course = enrollment.getCourse();

            // Count total lessons from course modules
            long totalLessons = 0;
            if (course.getModules() != null) {
                for (var module : course.getModules()) {
                    if (module.getLessons() != null) {
                        totalLessons += module.getLessons().size();
                    }
                }
            }

            // Count actual completed lessons from LessonProgress table (always accurate)
            long completedLessons = lessonProgressRepository.countCompletedLessonsByUserAndCourse(user, course);

            // Compute live progress percentage
            BigDecimal liveProgress = totalLessons > 0
                    ? BigDecimal.valueOf(completedLessons)
                            .divide(BigDecimal.valueOf(totalLessons), 2, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            boolean isNowComplete = totalLessons > 0 && completedLessons == totalLessons;

            response.setProgressPercentage(liveProgress);
            response.setCompletedLessons((int) completedLessons);
            response.setTotalLessons((int) totalLessons);
            response.setIsCompleted(isNowComplete);
        } catch (Exception e) {
            log.warn("Failed to compute live progress for enrollment {}: {}", enrollment.getId(), e.getMessage());
            // Fall back to whatever fromEntity already set
        }
        return response;
    }

    @Override
    public List<EnrollmentResponse> getContinueWatching(int limit) {
        User user = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(0, limit);
        List<CourseEnrollment> enrollments = enrollmentRepository.findContinueWatching(user, pageRequest);
        return enrollments.stream()
                .map(enrollment -> buildEnrollmentResponseWithLiveProgress(enrollment, user))
                .collect(Collectors.toList());
    }

    @Override
    public PageResponse<EnrollmentResponse> getCourseStudents(UUID courseId, int page, int size) {
        Course course = courseService.findById(courseId);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "enrolledAt"));
        Page<CourseEnrollment> enrollments = enrollmentRepository.findByCourse(course, pageRequest);
        return PageResponse.from(enrollments, EnrollmentResponse::fromEntity);
    }

    @Override
    @Transactional
    public void updateLastAccessed(UUID enrollmentId, UUID lessonId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        enrollment.setLastAccessedLessonId(lessonId);
        enrollment.setLastAccessedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void updateProgress(UUID enrollmentId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        long totalLessons = enrollment.getCourse().getModules().stream()
                .mapToLong(m -> m.getLessons().size())
                .sum();

        if (totalLessons == 0) {
            return;
        }

        long completedLessons = lessonProgressRepository.countCompletedLessonsByUserAndCourse(
                enrollment.getUser(), enrollment.getCourse()
        );

        BigDecimal progress = BigDecimal.valueOf(completedLessons)
                .divide(BigDecimal.valueOf(totalLessons), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        enrollment.setProgressPercentage(progress);

        // Sync completedLessonsJson so EnrollmentResponse.fromEntity() reports the correct count
        if (completedLessons == 0) {
            enrollment.setCompletedLessonsJson(null);
        } else {
            StringBuilder sb = new StringBuilder("[");
            for (long i = 0; i < completedLessons; i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(i).append("\"");
            }
            sb.append("]");
            enrollment.setCompletedLessonsJson(sb.toString());
        }

        if (completedLessons == totalLessons && !enrollment.getIsCompleted()) {
            enrollment.setIsCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());

            // Save completion status first — independent of certificate generation
            enrollmentRepository.save(enrollment);

            // Auto-generate certificate in its own separate transaction (REQUIRES_NEW).
            // If certificate generation fails it rolls back only itself and never
            // poisons this transaction, so lesson progress is always saved correctly.
            try {
                var cert = certificateService.generateCertificate(
                        enrollment.getUser(), enrollment.getCourse());
                // Link the certificate ID and save again
                enrollment.setCertificateId(cert.getId());
                enrollmentRepository.save(enrollment);
                log.info("Certificate auto-generated: {} for user: {} course: {}",
                        cert.getCertificateNumber(),
                        enrollment.getUser().getEmail(),
                        enrollment.getCourse().getTitle());
            } catch (Exception e) {
                // Certificate failure must never block lesson completion — just log it
                log.warn("Certificate auto-generation skipped for user: {} course: {} — reason: {}",
                        enrollment.getUser().getEmail(),
                        enrollment.getCourse().getTitle(),
                        e.getMessage());
            }
        } else {
            enrollmentRepository.save(enrollment);
        }
    }

    @Override
    @Transactional
    public void markCourseComplete(UUID enrollmentId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        enrollment.setIsCompleted(true);
        enrollment.setCompletedAt(LocalDateTime.now());
        enrollment.setProgressPercentage(BigDecimal.valueOf(100));
        enrollmentRepository.save(enrollment);

        log.info("Course completed by user: {} - Course: {}",
                enrollment.getUser().getEmail(), enrollment.getCourse().getTitle());

        // Auto-generate certificate
        try {
            var cert = certificateService.generateCertificate(
                    enrollment.getUser(), enrollment.getCourse());
            enrollment.setCertificateId(cert.getId());
            enrollmentRepository.save(enrollment);
            log.info("Certificate auto-generated: {} for user: {} course: {}",
                    cert.getCertificateNumber(),
                    enrollment.getUser().getEmail(),
                    enrollment.getCourse().getTitle());
        } catch (Exception e) {
            log.error("Failed to auto-generate certificate for user: {} course: {}",
                    enrollment.getUser().getEmail(), enrollment.getCourse().getTitle(), e);
        }
    }

    @Override
    public long getStudentCountForInstructor() {
        User instructor = getCurrentUser();
        return enrollmentRepository.countStudentsByInstructor(instructor);
    }

    @Override
    public long getEnrollmentCountForCourse(UUID courseId) {
        Course course = courseService.findById(courseId);
        return enrollmentRepository.countByCourse(course);
    }

    @Override
    public PageResponse<InstructorStudentResponse> getMyStudents(int page, int size, String search) {
        User instructor = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> studentsPage;

        if (search != null && !search.isBlank()) {
            studentsPage = enrollmentRepository.findDistinctStudentsByInstructorAndSearch(
                    instructor, search.trim(), pageRequest);
        } else {
            studentsPage = enrollmentRepository.findDistinctStudentsByInstructor(instructor, pageRequest);
        }

        return PageResponse.from(studentsPage, student -> {
            List<CourseEnrollment> enrollments = enrollmentRepository.findByInstructorAndStudent(instructor, student);

            double avgProgress = enrollments.stream()
                    .mapToDouble(e -> e.getProgressPercentage() != null
                            ? e.getProgressPercentage().doubleValue() : 0.0)
                    .average()
                    .orElse(0.0);

            LocalDateTime firstEnrolled = enrollments.stream()
                    .map(CourseEnrollment::getEnrolledAt)
                    .filter(Objects::nonNull)
                    .min(LocalDateTime::compareTo)
                    .orElse(null);

            LocalDateTime lastAccessed = enrollments.stream()
                    .map(CourseEnrollment::getLastAccessedAt)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            return InstructorStudentResponse.builder()
                    .id(student.getId())
                    .fullName(student.getFullName())
                    .email(student.getEmail())
                    .avatarUrl(student.getAvatarUrl())
                    .enrolledCoursesCount(enrollments.size())
                    .averageProgress(Math.round(avgProgress * 10.0) / 10.0)
                    .firstEnrolledAt(firstEnrolled)
                    .lastAccessedAt(lastAccessed)
                    .build();
        });
    }

    @Override
    public InstructorStudentDetailResponse getStudentDetail(UUID studentId) {
        User instructor = getCurrentUser();
        User student = userService.findById(studentId);

        List<CourseEnrollment> enrollments = enrollmentRepository.findByInstructorAndStudent(instructor, student);

        double avgProgress = enrollments.stream()
                .mapToDouble(e -> e.getProgressPercentage() != null
                        ? e.getProgressPercentage().doubleValue() : 0.0)
                .average()
                .orElse(0.0);

        LocalDateTime firstEnrolled = enrollments.stream()
                .map(CourseEnrollment::getEnrolledAt)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime lastAccessed = enrollments.stream()
                .map(CourseEnrollment::getLastAccessedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        List<EnrollmentResponse> courseList = enrollments.stream()
                .map(EnrollmentResponse::fromEntity)
                .collect(Collectors.toList());

        return InstructorStudentDetailResponse.builder()
                .id(student.getId())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .avatarUrl(student.getAvatarUrl())
                .joinedAt(student.getCreatedAt())
                .enrolledCoursesCount(enrollments.size())
                .averageProgress(Math.round(avgProgress * 10.0) / 10.0)
                .firstEnrolledAt(firstEnrolled)
                .lastAccessedAt(lastAccessed)
                .enrolledCourses(courseList)
                .build();
    }

    private CourseEnrollment createEnrollment(User user, Course course, EnrollmentType type, LocalDateTime expiresAt) {
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .user(user)
                .course(course)
                .enrollmentType(type)
                .enrolledAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .progressPercentage(BigDecimal.ZERO)
                .isCompleted(false)
                .isActive(true)
                .build();

        enrollment = enrollmentRepository.save(enrollment);

        course.incrementEnrollmentCount();
        courseRepository.save(course);

        emailService.sendCourseEnrollmentConfirmation(user, course.getTitle());

        log.info("User {} enrolled in course {} via {}", user.getEmail(), course.getTitle(), type);

        return enrollment;
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
