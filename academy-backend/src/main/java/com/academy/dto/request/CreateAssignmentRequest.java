package com.academy.dto.request;

import com.academy.entity.enums.AssignmentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateAssignmentRequest {

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    @NotBlank(message = "Assignment title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    private String description;

    private String instructions;

    private LocalDate dueDate;

    @Min(value = 1, message = "Total mark must be at least 1")
    @Max(value = 1000, message = "Total mark cannot exceed 1000")
    private Integer totalMark = 100;

    private AssignmentStatus status = AssignmentStatus.DRAFT;
}
