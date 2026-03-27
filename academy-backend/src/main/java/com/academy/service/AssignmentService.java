package com.academy.service;

import com.academy.dto.request.CreateAssignmentRequest;
import com.academy.dto.response.AssignmentResponse;
import com.academy.dto.response.PageResponse;

import java.util.UUID;

public interface AssignmentService {

    PageResponse<AssignmentResponse> getMyAssignments(int page, int size);

    AssignmentResponse getAssignmentById(UUID id);

    AssignmentResponse createAssignment(CreateAssignmentRequest request);

    AssignmentResponse updateAssignment(UUID id, CreateAssignmentRequest request);

    void deleteAssignment(UUID id);
}
