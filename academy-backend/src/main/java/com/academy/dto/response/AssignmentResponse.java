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
    private String titleAr;
    private String descriptionAr;
    private String instructionsAr;
    private LocalDate dueDate;
    private Integer totalMark;
    private AssignmentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Student views only: NONE | SUBMITTED | GRADED for the current student. */
    private String mySubmissionStatus;
    private Integer myGrade;
    /** Student views only: null while not marked; true when the mark reaches passPercentage. */
    private Boolean myPassed;
    /** Student views only: true after a failing first attempt (one resubmission allowed). */
    private Boolean myCanResubmit;
    private Integer myAttemptNumber;

    /** A mark of at least this percentage of totalMark passes the assignment. */
    private Integer passPercentage;
    private Integer maxAttempts;

    /** Every course of the assignment, primary first (courseId/courseTitle = the primary course). */
    private java.util.List<UUID> courseIds;
    private java.util.List<CourseRef> courses;
    /** Printed on the certificate (instructor's title); null = primary course name. */
    private String certificateTitle;

    /** Student views only: true when every linked course is finished (lessons + published quizzes). */
    private Boolean myUnlocked;
    /** Student views only: what is still missing, per linked course. */
    private java.util.List<AssignmentRequirementResponse> myMissing;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseRef {
        private UUID id;
        private String title;
        private String titleAr;
        private String slug;
    }

    public static AssignmentResponse fromEntity(Assignment assignment) {
        java.util.List<CourseRef> refs = assignment.linkedCourses().stream()
                .map(c -> CourseRef.builder().id(c.getId()).title(c.getTitle())
                        .titleAr(c.getTitleAr()).slug(c.getSlug()).build())
                .toList();
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourse().getId())
                .courseTitle(assignment.getCourse().getTitle())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .instructions(assignment.getInstructions())
                .titleAr(assignment.getTitleAr())
                .descriptionAr(assignment.getDescriptionAr())
                .instructionsAr(assignment.getInstructionsAr())
                .dueDate(assignment.getDueDate())
                .totalMark(assignment.getTotalMark())
                .status(assignment.getStatus())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .passPercentage(Assignment.PASS_PERCENTAGE)
                .maxAttempts(Assignment.MAX_ATTEMPTS)
                .courseIds(refs.stream().map(CourseRef::getId).toList())
                .courses(refs)
                .certificateTitle(assignment.getCertificateTitle())
                .build();
    }
}
