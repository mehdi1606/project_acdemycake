package com.academy.dto.response;

import com.academy.entity.AssignmentSubmission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SubmissionResponse {

    private UUID id;
    private UUID assignmentId;
    private String assignmentTitle;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String content;
    private String fileUrl;
    private Integer grade;
    private Integer totalMark;
    private String feedback;
    private LocalDateTime gradedAt;
    private String gradedByName;
    private LocalDateTime submittedAt;

    public static SubmissionResponse fromEntity(AssignmentSubmission s) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .assignmentId(s.getAssignment().getId())
                .assignmentTitle(s.getAssignment().getTitle())
                .studentId(s.getStudent().getId())
                .studentName(s.getStudent().getFullName())
                .studentEmail(s.getStudent().getEmail())
                .content(s.getContent())
                .fileUrl(s.getFileUrl())
                .grade(s.getGrade())
                .totalMark(s.getAssignment().getTotalMark())
                .feedback(s.getFeedback())
                .gradedAt(s.getGradedAt())
                .gradedByName(s.getGradedBy() != null ? s.getGradedBy().getFullName() : null)
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
