package com.academy.service.impl;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.request.GradeSubmissionRequest;
import com.academy.dto.request.SubmitAssignmentRequest;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.SubmissionResponse;
import com.academy.entity.Assignment;
import com.academy.entity.AssignmentSubmission;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.enums.AssignmentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.AssignmentRepository;
import com.academy.repository.AssignmentSubmissionRepository;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.AssignmentService;
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
    private final UserService userService;

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
    @Transactional
    public SubmissionResponse submitAssignment(UUID assignmentId, SubmitAssignmentRequest request) {
        User student = getCurrentUser();
        Assignment assignment = findAssignmentById(assignmentId);

        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new BadRequestException("Assignment is not open for submission");
        }

        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate().atStartOfDay())) {
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
        return SubmissionResponse.fromEntity(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
