package com.academy.dto.response;

import com.academy.entity.Certificate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {
    private UUID id;
    private String certificateNumber;
    private String studentName;
    private String studentEmail;
    private UUID courseId;
    private String courseTitle;
    /** The passed assignment that earned the certificate (null for older certificates). */
    private UUID assignmentId;
    private String instructorName;
    private String pdfUrl;
    private LocalDateTime completionDate;
    private LocalDateTime issuedAt;

    public static CertificateResponse fromEntity(Certificate certificate) {
        return CertificateResponse.builder()
                .id(certificate.getId())
                .certificateNumber(certificate.getCertificateNumber())
                .studentName(certificate.getStudentName())
                .studentEmail(certificate.getUser().getEmail())
                .courseId(certificate.getCourse().getId())
                // The printed title: the instructor's certificate title, else the course name.
                .courseTitle(certificate.displayTitle())
                .assignmentId(certificate.getAssignment() != null ? certificate.getAssignment().getId() : null)
                .instructorName(certificate.getInstructorName())
                .pdfUrl(certificate.getPdfUrl())
                .completionDate(certificate.getCompletionDate())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }
}
