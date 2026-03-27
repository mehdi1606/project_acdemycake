package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates", indexes = {
        @Index(name = "idx_certificates_user_id", columnList = "user_id"),
        @Index(name = "idx_certificates_course_id", columnList = "course_id"),
        @Index(name = "idx_certificates_certificate_number", columnList = "certificate_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 50)
    private String certificateNumber;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "student_name", nullable = false, length = 255)
    private String studentName;

    @Column(name = "course_title", nullable = false, length = 255)
    private String courseTitle;

    @Column(name = "instructor_name", length = 255)
    private String instructorName;

    @Column(name = "completion_date", nullable = false)
    private LocalDateTime completionDate;
}
