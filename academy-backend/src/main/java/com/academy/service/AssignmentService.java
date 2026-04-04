package com.academy.service;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.request.GradeSubmissionRequest;
import com.academy.dto.request.SubmitAssignmentRequest;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.SubmissionResponse;

import java.util.UUID;

public interface AssignmentService {

    PageResponse<AssignmentResponse> getMyAssignments(int page, int size);

    AssignmentResponse getAssignmentById(UUID id);

    AssignmentResponse createAssignment(CreateAssignmentRequest request);

    AssignmentResponse updateAssignment(UUID id, CreateAssignmentRequest request);

    void deleteAssignment(UUID id);

    // Student-facing
    PageResponse<AssignmentResponse> getStudentAssignments(int page, int size);

    SubmissionResponse submitAssignment(UUID assignmentId, SubmitAssignmentRequest request);

    SubmissionResponse getMySubmission(UUID assignmentId);

    // Instructor-facing
    PageResponse<SubmissionResponse> getSubmissionsForAssignment(UUID assignmentId, int page, int size);

    SubmissionResponse gradeSubmission(UUID submissionId, GradeSubmissionRequest request);
}
