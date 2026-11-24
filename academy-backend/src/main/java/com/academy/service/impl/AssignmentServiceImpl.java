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
import com.academy.security.FileUrlSigner;
import com.academy.security.UserPrincipal;
import com.academy.service.AssignmentService;
import com.academy.dto.response.AssignmentRequirementResponse;
import com.academy.service.AssignmentRequirementsService;
import com.academy.service.CertificateService;
import com.academy.service.EnrollmentService;
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
    private final com.academy.security.FileUrlSigner fileUrlSigner;
    private final CourseRepository courseRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final CertificateService certificateService;
    private final com.academy.repository.CertificateRepository certificateRepository;
    private final EnrollmentService enrollmentService;
    private final AssignmentRequirementsService assignmentRequirementsService;
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

        List<Course> linked = resolveCourses(request, instructor);
        if (linked.isEmpty()) {
            throw new BadRequestException("Choose at least one course for this assignment");
        }
        String certificateTitle = blankToNull(request.getCertificateTitle());
        requireCertificateTitle(linked, certificateTitle);

        Assignment assignment = Assignment.builder()
                .course(linked.get(0))
                .courses(new java.util.LinkedHashSet<>(linked))
                .certificateTitle(certificateTitle)
                .instructor(instructor)
                .title(request.getTitle())
                .description(request.getDescription())
                .instructions(request.getInstructions())
                .titleAr(blankToNull(request.getTitleAr()))
                .descriptionAr(blankToNull(request.getDescriptionAr()))
                .instructionsAr(blankToNull(request.getInstructionsAr()))
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

        // Courses: courseIds (or the single courseId of older clients) replaces the links when sent.
        List<Course> linked = resolveCourses(request, instructor);
        if (!linked.isEmpty()) {
            assignment.setCourse(linked.get(0));
            assignment.getCourses().clear();
            assignment.getCourses().addAll(linked);
        }
        // null = not sent (unchanged); "" clears it.
        if (request.getCertificateTitle() != null) {
            assignment.setCertificateTitle(blankToNull(request.getCertificateTitle()));
        }
        requireCertificateTitle(assignment.linkedCourses(), assignment.getCertificateTitle());

        if (request.getTitle() != null) assignment.setTitle(request.getTitle());
        if (request.getDescription() != null) assignment.setDescription(request.getDescription());
        if (request.getInstructions() != null) assignment.setInstructions(request.getInstructions());
        // An empty string clears a translation; null means "not sent" and leaves it unchanged.
        if (request.getTitleAr() != null) assignment.setTitleAr(blankToNull(request.getTitleAr()));
        if (request.getDescriptionAr() != null) assignment.setDescriptionAr(blankToNull(request.getDescriptionAr()));
        if (request.getInstructionsAr() != null) assignment.setInstructionsAr(blankToNull(request.getInstructionsAr()));
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

        // Published assignments linked to any course the student is enrolled in
        Page<Assignment> assignments = assignmentRepository.findPublishedByEnrolledStudent(student, pageRequest);
        return PageResponse.from(assignments, a -> withMySubmission(a, student));
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
        // Visible to a student who can access at least one of its courses; whether they may
        // submit is shown by myUnlocked / myMissing.
        boolean anyAccess = assignment.linkedCourses().stream()
                .anyMatch(c -> enrollmentService.hasAccess(student, c));
        if (!anyAccess) {
            throw new ForbiddenException("You don't have access to this assignment's courses");
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
        return fileUrlSigner.signUrl(fileStorageService.getFileUrl(stored));
    }

    @Override
    @Transactional
    public SubmissionResponse submitAssignment(UUID assignmentId, SubmitAssignmentRequest request) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new BadRequestException("Assignment is not open for submission");
        }

        // The assignment unlocks only when every linked course is finished: access, every lesson
        // completed and every published quiz passed (an expired subscription or a refund locks it).
        List<AssignmentRequirementResponse> missing = assignmentRequirementsService.missingFor(student, assignment);
        if (!missing.isEmpty()) {
            if (missing.stream().allMatch(AssignmentRequirementResponse::isNoAccess)
                    && missing.size() == assignment.linkedCourses().size()) {
                throw new ForbiddenException("You don't have access to this assignment's courses");
            }
            throw new BadRequestException("Finish these courses first (all lessons and quizzes): "
                    + missing.stream().map(AssignmentRequirementResponse::getCourseTitle)
                            .collect(java.util.stream.Collectors.joining(", ")));
        }

        AssignmentSubmission existing = assignmentSubmissionRepository
                .findByAssignmentAndStudent(assignment, student).orElse(null);
        if (existing != null) {
            return resubmit(existing, request);
        }

        // The due date is a whole day — the student keeps it until 23:59:59, so compare
        // against the END of that day (atStartOfDay() would reject the due date itself).
        if (assignment.getDueDate() != null
                && LocalDateTime.now().isAfter(assignment.getDueDate().atTime(LocalTime.MAX))) {
            throw new BadRequestException("Assignment due date has passed");
        }

        AssignmentSubmission submission = AssignmentSubmission.builder()
                .assignment(assignment)
                .student(student)
                .content(request.getContent())
                .fileUrl(validatedFileUrl(request.getFileUrl()))
                .build();

        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        log.info("Assignment {} submitted by student: {}", assignmentId, student.getEmail());
        return toResponse(saved);
    }

    /**
     * The one retry allowed after a failing mark on the first attempt. The same row is reused:
     * the first attempt's mark and feedback move to previous_*, the new work awaits a mark.
     * The due date does not apply — the failing mark reopened the assignment.
     */
    private SubmissionResponse resubmit(AssignmentSubmission submission, SubmitAssignmentRequest request) {
        if (!submission.isGraded()) {
            throw new BadRequestException("Your submission is waiting for the instructor's mark");
        }
        if (submission.isPassed()) {
            throw new BadRequestException("You have already passed this assignment");
        }
        if (!submission.canResubmit()) {
            throw new BadRequestException("You have no submission attempts left for this assignment");
        }

        submission.setPreviousGrade(submission.getGrade());
        submission.setPreviousFeedback(submission.getFeedback());
        submission.setGrade(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);
        submission.setGradedBy(null);
        submission.setContent(request.getContent());
        submission.setFileUrl(validatedFileUrl(request.getFileUrl()));
        submission.setAttemptNumber(Assignment.MAX_ATTEMPTS);
        submission.setSubmittedAt(LocalDateTime.now());

        AssignmentSubmission saved = assignmentSubmissionRepository.save(submission);
        log.info("Assignment {} resubmitted (attempt {}) by student: {}",
                saved.getAssignment().getId(), saved.getAttemptNumber(), saved.getStudent().getEmail());
        return toResponse(saved);
    }

    @Override
    public SubmissionResponse getMySubmission(UUID assignmentId) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        return assignmentSubmissionRepository.findByAssignmentAndStudent(assignment, student)
                .map(this::toResponse)
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
        return PageResponse.from(submissions, this::toResponse);
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
        log.info("Submission {} graded by instructor: {} ({}/{}, {})", submissionId, instructor.getEmail(),
                saved.getGrade(), totalMark, saved.isPassed() ? "passed" : "not passed");

        notifyStudentOfMark(saved);

        // A passing mark may complete the requirements for the certificate. Issue it only
        // after this transaction commits, so the certificate check can see the grade.
        if (saved.isPassed()) {
            issueCertificateAfterCommit(saved.getStudent().getId(), saved.getAssignment().getId());
        }

        return toResponse(saved);
    }

    /** Tell the student their mark, whether it passed, and whether they may resubmit. */
    private void notifyStudentOfMark(AssignmentSubmission s) {
        Assignment a = s.getAssignment();
        String mark = s.getGrade() + "/" + a.getTotalMark();
        String title;
        String body;
        if (s.isPassed()) {
            title = "Assignment passed";
            body = "\"" + a.getTitle() + "\" was marked " + mark + ". Well done — you passed.";
        } else if (s.canResubmit()) {
            title = "Assignment not passed — you can resubmit";
            body = "\"" + a.getTitle() + "\" was marked " + mark + ". A mark of " + Assignment.PASS_PERCENTAGE
                    + "% is needed to pass. Read the feedback and send a new version (one more attempt).";
        } else {
            title = "Assignment not passed";
            body = "\"" + a.getTitle() + "\" was marked " + mark + ". A mark of " + Assignment.PASS_PERCENTAGE
                    + "% is needed to pass, and no attempts are left.";
        }
        UUID studentId = s.getStudent().getId();
        UUID submissionId = s.getId();
        String link = "/student/student-assignments?assignment=" + a.getId();

        // Sent after the mark is committed, in its own transaction: a failing notification
        // must never roll back (and lose) the instructor's mark.
        Runnable send = () -> {
            try {
                TransactionTemplate tx = new TransactionTemplate(transactionManager);
                tx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                tx.executeWithoutResult(status -> notificationService.createNotification(
                        userService.findById(studentId), title, body, NotificationType.COURSE, link));
            } catch (Exception e) {
                log.warn("Mark notification not sent for submission {}: {}", submissionId, e.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Submission with a fresh, expiring link to its uploaded file (if any). */
    private SubmissionResponse toResponse(AssignmentSubmission s) {
        SubmissionResponse r = SubmissionResponse.fromEntity(s);
        r.setFileUrl(fileUrlSigner.signUrl(r.getFileUrl()));
        return r;
    }

    /**
     * A submission link must be a normal web link (http/https) — never javascript:
     * or data: (which would run in the instructor's browser). Our own upload links
     * are stored without their signature.
     */
    private static String validatedFileUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String u = url.trim();
        if (!u.toLowerCase().startsWith("https://") && !u.toLowerCase().startsWith("http://")) {
            throw new BadRequestException("The attachment must be a web link (http or https)");
        }
        return u.contains("/files/") ? FileUrlSigner.unsignUrl(u) : u;
    }

    /** Attach the current student's submission state so the course player can show it. */
    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private AssignmentResponse withMySubmission(Assignment assignment, User student) {
        AssignmentResponse response = AssignmentResponse.fromEntity(assignment);
        assignmentSubmissionRepository.findByAssignmentAndStudent(assignment, student).ifPresentOrElse(s -> {
            response.setMySubmissionStatus(s.getGrade() != null ? "GRADED" : "SUBMITTED");
            response.setMyGrade(s.getGrade());
            response.setMyPassed(s.isGraded() ? s.isPassed() : null);
            response.setMyCanResubmit(s.canResubmit());
            response.setMyAttemptNumber(s.getAttemptNumber());
        }, () -> {
            response.setMySubmissionStatus("NONE");
            response.setMyCanResubmit(false);
        });
        // Locked until every linked course is finished (lessons + published quizzes).
        List<AssignmentRequirementResponse> missing = assignmentRequirementsService.missingFor(student, assignment);
        response.setMyUnlocked(missing.isEmpty());
        response.setMyMissing(missing);
        if (!missing.isEmpty()) {
            response.setMyCanResubmit(false);
        }
        return response;
    }

    /**
     * Linked courses from the request, in the order sent (first = primary). Uses courseIds, or the
     * single courseId of older clients; empty when neither is sent. Every course must belong to
     * the instructor.
     */
    private List<Course> resolveCourses(CreateAssignmentRequest request, User instructor) {
        List<UUID> ids = request.getCourseIds() != null && !request.getCourseIds().isEmpty()
                ? request.getCourseIds()
                : (request.getCourseId() != null ? List.of(request.getCourseId()) : List.of());
        List<Course> courses = new java.util.ArrayList<>();
        for (UUID id : new java.util.LinkedHashSet<>(ids)) {
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                throw new ForbiddenException("You can only add your own courses to an assignment");
            }
            courses.add(course);
        }
        return courses;
    }

    private static void requireCertificateTitle(List<Course> linked, String certificateTitle) {
        if (linked.size() > 1 && (certificateTitle == null || certificateTitle.isBlank())) {
            throw new BadRequestException(
                    "Write the certificate title: it is required when the assignment covers several courses");
        }
    }

    /**
     * A passing mark: issue the student's certificate for this assignment (once every linked
     * course is finished) and tell them. Runs after commit because issueForAssignment uses its own
     * transaction, which could not see an uncommitted grade and would refuse.
     */
    private void issueCertificateAfterCommit(UUID studentId, UUID assignmentId) {
        Runnable issue = () -> {
            try {
                // REQUIRES_NEW: in afterCommit the finished transaction is still bound,
                // and REQUIRED would join it — the enrollment link and notification
                // would then never be flushed.
                TransactionTemplate tx = new TransactionTemplate(transactionManager);
                tx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                tx.executeWithoutResult(status -> {
                    User student = userService.findById(studentId);
                    Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
                    if (assignment == null) return;
                    if (certificateRepository.findFirstByUserAndAssignmentOrderByIssuedAtAsc(student, assignment).isPresent()) {
                        return;   // already issued (e.g. the mark was edited)
                    }
                    // Normally unlocked (submitting needs it); if a course gained lessons meanwhile,
                    // the certificate is issued when the student finishes them.
                    if (!assignmentRequirementsService.isUnlocked(student, assignment)) return;

                    var certificate = certificateService.issueForAssignment(student, assignment);
                    for (Course course : assignment.linkedCourses()) {
                        courseEnrollmentRepository.findByUserAndCourse(student, course).ifPresent(e -> {
                            if (e.getCertificateId() == null) {
                                e.setCertificateId(certificate.getId());
                                courseEnrollmentRepository.save(e);
                            }
                        });
                    }

                    notificationService.createNotification(
                            student,
                            "Your certificate is ready",
                            "You passed \"" + assignment.getTitle() + "\". Your certificate \""
                                    + certificate.getCourseTitle() + "\" is now available.",
                            NotificationType.COURSE,
                            "/student/student-certificates"
                    );
                    log.info("Certificate issued after grading: assignment {} → {}", assignmentId, student.getEmail());
                });
            } catch (Exception e) {
                log.warn("Certificate not issued after grading (assignment {}): {}", assignmentId, e.getMessage());
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
