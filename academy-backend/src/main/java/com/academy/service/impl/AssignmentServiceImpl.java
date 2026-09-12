package com.academy.service.impl;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.request.GradeSubmissionRequest;
import com.academy.dto.request.SubmitAssignmentRequest;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.SubmissionResponse;
import com.academy.entity.Assignment;
import com.academy.entity.AssignmentSubmission;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.enums.AssignmentStatus;
import com.academy.entity.enums.NotificationType;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.AssignmentRepository;
import com.academy.repository.AssignmentSubmissionRepository;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.AssignmentService;
import com.academy.service.CertificateService;
import com.academy.service.NotificationService;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final CertificateService certificateService;
    private final NotificationService notificationService;
    private final PlatformTransactionManager transactionManager;

    @Override
    public PageResponse<AssignmentResponse> getMyAssignments(int page, int size) {
        User instructor = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Assignment> assignments = assignmentRepository.findByInstructor(instructor, pageRequest);
        return PageResponse.from(assignments, AssignmentResponse::fromEntity);
    }

    @Override
    public AssignmentResponse getAssignmentById(UUID id) {
        User instructor = getCurrentUser();
        Assignment assignment = findAssignmentById(id);
        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this assignment");
        }
        return AssignmentResponse.fromEntity(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponse createAssignment(CreateAssignmentRequest request) {
        User instructor = getCurrentUser();

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this course");
        }

        Assignment assignment = Assignment.builder()
                .course(course)
                .instructor(instructor)
                .title(request.getTitle())
                .description(request.getDescription())
                .instructions(request.getInstructions())
                .dueDate(request.getDueDate())
                .totalMark(request.getTotalMark() != null ? request.getTotalMark() : 100)
                .status(request.getStatus() != null ? request.getStatus() : AssignmentStatus.DRAFT)
                .build();

        Assignment saved = assignmentRepository.save(assignment);
        log.info("Assignment created: {} by instructor: {}", saved.getId(), instructor.getEmail());
        return AssignmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AssignmentResponse updateAssignment(UUID id, CreateAssignmentRequest request) {
        User instructor = getCurrentUser();
        Assignment assignment = findAssignmentById(id);

        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this assignment");
        }

        if (request.getCourseId() != null && !request.getCourseId().equals(assignment.getCourse().getId())) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                throw new ForbiddenException("You don't have access to this course");
            }
            assignment.setCourse(course);
        }

        if (request.getTitle() != null) assignment.setTitle(request.getTitle());
        if (request.getDescription() != null) assignment.setDescription(request.getDescription());
        if (request.getInstructions() != null) assignment.setInstructions(request.getInstructions());
        if (request.getDueDate() != null) assignment.setDueDate(request.getDueDate());
        if (request.getTotalMark() != null) assignment.setTotalMark(request.getTotalMark());
        if (request.getStatus() != null) assignment.setStatus(request.getStatus());

        Assignment saved = assignmentRepository.save(assignment);
        log.info("Assignment updated: {}", saved.getId());
        return AssignmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteAssignment(UUID id) {
        User instructor = getCurrentUser();
        Assignment assignment = findAssignmentById(id);

        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this assignment");
        }

        assignmentRepository.delete(assignment);
        log.info("Assignment deleted: {}", id);
    }

    // ── Student-facing ────────────────────────────────────────────────────────

    @Override
    public PageResponse<AssignmentResponse> getStudentAssignments(int page, int size) {
        User student = getCurrentUser();
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Fetch assignments from courses the student is enrolled in and that are PUBLISHED
        Page<Assignment> assignments = assignmentRepository.findPublishedByEnrolledStudent(student, pageRequest);
        return PageResponse.from(assignments, AssignmentResponse::fromEntity);
    }

    @Override
    public List<AssignmentResponse> getStudentAssignmentsForCourse(UUID courseId) {
        User student = getCurrentUser();
        return assignmentRepository.findPublishedByEnrolledStudentAndCourse(student, courseId)
                .stream()
                .map(a -> withMySubmission(a, student))
                .toList();
    }

    @Override
    public AssignmentResponse getStudentAssignmentById(UUID assignmentId) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);
        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Assignment", "id", assignmentId);
        }
        if (!courseEnrollmentRepository.existsByUserAndCourse(student, assignment.getCourse())) {
            throw new ForbiddenException("You are not enrolled in this course");
        }
        return withMySubmission(assignment, student);
    }

    @Override
    public String uploadSubmissionFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        // Size (10MB) and extension (pdf/doc/docx/images) are enforced by FileStorageService.
        String stored = fileStorageService.storeFile(file, "assignment-submissions");
        return fileStorageService.getFileUrl(stored);
    }

    @Override
    @Transactional
    public SubmissionResponse submitAssignment(UUID assignmentId, SubmitAssignmentRequest request) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new BadRequestException("Assignment is not open for submission");
        }

        // The due date is a whole day — the student keeps it until 23:59:59, so compare
        // against the END of that day (atStartOfDay() would reject the due date itself).
        if (assignment.getDueDate() != null
                && LocalDateTime.now().isAfter(assignment.getDueDate().atTime(LocalTime.MAX))) {
            throw new BadRequestException("Assignment due date has passed");
        }

        boolean enrolled = courseEnrollmentRepository.existsByUserAndCourse(student, assignment.getCourse());
        if (!enrolled) {
            throw new ForbiddenException("You are not enrolled in this course");
        }

        if (assignmentSubmissionRepository.existsByAssignmentAndStudent(assignment, student)) {
            throw new BadRequestException("You have already submitted this assignment");
        }

        AssignmentSubmission submission = AssignmentSubmission.builder()
                .assignment(assignment)
                .student(student)
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .build();

        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        log.info("Assignment {} submitted by student: {}", assignmentId, student.getEmail());
        return SubmissionResponse.fromEntity(saved);
    }

    @Override
    public SubmissionResponse getMySubmission(UUID assignmentId) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        return assignmentSubmissionRepository.findByAssignmentAndStudent(assignment, student)
                .map(SubmissionResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "assignmentId", assignmentId));
    }

    // ── Instructor-facing ─────────────────────────────────────────────────────

    @Override
    public PageResponse<SubmissionResponse> getSubmissionsForAssignment(UUID assignmentId, int page, int size) {
        User instructor = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this assignment");
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"));
        Page<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignment(assignment, pageRequest);
        return PageResponse.from(submissions, SubmissionResponse::fromEntity);
    }

    @Override
    @Transactional
    public SubmissionResponse gradeSubmission(UUID submissionId, GradeSubmissionRequest request) {
        User instructor = getCurrentUser();

        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        if (!submission.getAssignment().getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this submission");
        }

        int totalMark = submission.getAssignment().getTotalMark();
        if (request.getGrade() > totalMark) {
            throw new BadRequestException("Grade cannot exceed total mark of " + totalMark);
        }

        submission.setGrade(request.getGrade());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(LocalDateTime.now());
        submission.setGradedBy(instructor);

        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        log.info("Submission {} graded by instructor: {}", submissionId, instructor.getEmail());

        // This mark may complete the requirements for a withheld certificate. Issue it only
        // after this transaction commits, so the certificate check can see the grade.
        issueCertificateAfterCommit(saved.getStudent().getId(), saved.getAssignment().getCourse().getId());

        return SubmissionResponse.fromEntity(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Attach the current student's submission state so the course player can show it. */
    private AssignmentResponse withMySubmission(Assignment assignment, User student) {
        AssignmentResponse response = AssignmentResponse.fromEntity(assignment);
        assignmentSubmissionRepository.findByAssignmentAndStudent(assignment, student).ifPresentOrElse(s -> {
            response.setMySubmissionStatus(s.getGrade() != null ? "GRADED" : "SUBMITTED");
            response.setMyGrade(s.getGrade());
        }, () -> response.setMySubmissionStatus("NONE"));
        return response;
    }

    /**
     * If the student already finished the course and this was the last missing mark,
     * issue the certificate that was withheld and tell the student.
     *
     * Runs after commit because generateCertificate uses its own transaction, which
     * could not see an uncommitted grade and would refuse again.
     */
    private void issueCertificateAfterCommit(UUID studentId, UUID courseId) {
        Runnable issue = () -> {
            try {
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                    User student = userService.findById(studentId);
                    Course course = courseRepository.findById(courseId).orElse(null);
                    if (course == null) return;
                    CourseEnrollment enrollment = courseEnrollmentRepository
                            .findByUserAndCourse(student, course).orElse(null);
                    if (enrollment == null || !Boolean.TRUE.equals(enrollment.getIsCompleted())
                            || enrollment.getCertificateId() != null) return;
                    if (assignmentRepository.countUngradedPublishedForStudent(course, student) > 0) return;

                    var certificate = certificateService.generateCertificate(student, course);
                    enrollment.setCertificateId(certificate.getId());
                    courseEnrollmentRepository.save(enrollment);

                    notificationService.createNotification(
                            student,
                            "Your certificate is ready",
                            "Your assignment for \"" + course.getTitle() + "\" has been marked. Your certificate is now available.",
                            NotificationType.COURSE,
                            "/student/student-certificates"
                    );
                    log.info("Certificate issued after grading: {} → {}", course.getTitle(), student.getEmail());
                });
            } catch (Exception e) {
                log.warn("Certificate not issued after grading (course {}): {}", courseId, e.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    issue.run();
                }
            });
        } else {
            issue.run();
        }
    }

    private Assignment findAssignmentById(UUID id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
    }

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
