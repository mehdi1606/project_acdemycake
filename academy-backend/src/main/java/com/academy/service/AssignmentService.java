package com.academy.service;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.request.GradeSubmissionRequest;
import com.academy.dto.request.SubmitAssignmentRequest;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.SubmissionResponse;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface AssignmentService {

    PageResponse<AssignmentResponse> getMyAssignments(int page, int size);

    AssignmentResponse getAssignmentById(UUID id);

    AssignmentResponse createAssignment(CreateAssignmentRequest request);

    AssignmentResponse updateAssignment(UUID id, CreateAssignmentRequest request);

    void deleteAssignment(UUID id);

    // Student-facing
    PageResponse<AssignmentResponse> getStudentAssignments(int page, int size);

    /** Published assignments of a single course the student is enrolled in. */
    List<AssignmentResponse> getStudentAssignmentsForCourse(UUID courseId);

    SubmissionResponse submitAssignment(UUID assignmentId, SubmitAssignmentRequest request);

    SubmissionResponse getMySubmission(UUID assignmentId);

    /** Store a student's submission attachment and return its URL. */
    String uploadSubmissionFile(MultipartFile file);

    // Instructor-facing
    PageResponse<SubmissionResponse> getSubmissionsForAssignment(UUID assignmentId, int page, int size);

    SubmissionResponse gradeSubmission(UUID submissionId, GradeSubmissionRequest request);
}
