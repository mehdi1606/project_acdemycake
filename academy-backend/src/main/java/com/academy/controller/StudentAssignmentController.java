package com.academy.controller;

import com.academy.dto.request.SubmitAssignmentRequest;
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
@RequestMapping("/api/v1/student/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student Assignment", description = "Student assignment and submission endpoints")
public class StudentAssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    @Operation(summary = "Get all published assignments for enrolled courses")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentResponse>>> getMyAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getStudentAssignments(page, size)));
    }

    @PostMapping("/{assignmentId}/submit")
    @Operation(summary = "Submit an assignment")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitAssignment(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody SubmitAssignmentRequest request) {
        SubmissionResponse response = assignmentService.submitAssignment(assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Assignment submitted successfully", response));
    }

    @GetMapping("/{assignmentId}/my-submission")
    @Operation(summary = "Get my submission for an assignment")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getMySubmission(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getMySubmission(assignmentId)));
    }
}
