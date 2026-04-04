package com.academy.controller;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.request.GradeSubmissionRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.SubmissionResponse;
import com.academy.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/instructor/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
@Tag(name = "Assignment", description = "Instructor assignment management endpoints")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    @Operation(summary = "Get all assignments for the current instructor")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentResponse>>> getMyAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<AssignmentResponse> response = assignmentService.getMyAssignments(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single assignment by ID")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignment(@PathVariable UUID id) {
        AssignmentResponse response = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new assignment")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request) {
        AssignmentResponse response = assignmentService.createAssignment(request);
        return ResponseEntity.ok(ApiResponse.success("Assignment created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an assignment")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAssignmentRequest request) {
        AssignmentResponse response = assignmentService.updateAssignment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Assignment updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an assignment")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable UUID id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Assignment deleted successfully"));
    }

    @GetMapping("/{id}/submissions")
    @Operation(summary = "Get all submissions for an assignment")
    public ResponseEntity<ApiResponse<PageResponse<SubmissionResponse>>> getSubmissions(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getSubmissionsForAssignment(id, page, size)));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    @Operation(summary = "Grade a student submission")
    public ResponseEntity<ApiResponse<SubmissionResponse>> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeSubmissionRequest request) {
        SubmissionResponse response = assignmentService.gradeSubmission(submissionId, request);
        return ResponseEntity.ok(ApiResponse.success("Submission graded successfully", response));
    }
}
