package com.academy.dto.response;

import com.academy.entity.Assignment;
import com.academy.entity.enums.AssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private UUID id;
    private UUID courseId;
    private String courseTitle;
    private String title;
    private String description;
    private String instructions;
    private LocalDate dueDate;
    private Integer totalMark;
    private AssignmentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AssignmentResponse fromEntity(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourse().getId())
                .courseTitle(assignment.getCourse().getTitle())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .instructions(assignment.getInstructions())
                .dueDate(assignment.getDueDate())
                .totalMark(assignment.getTotalMark())
                .status(assignment.getStatus())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }
}
