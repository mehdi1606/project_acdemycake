package com.academy.service;

import com.academy.dto.response.CertificateResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.User;

import java.util.UUID;

public interface CertificateService {

    PageResponse<CertificateResponse> getMyCertificates(int page, int size);

    CertificateResponse getCertificateById(UUID id);

    CertificateResponse verifyCertificate(String certificateNumber);

    byte[] downloadCertificate(UUID id);

    /**
     * Certificates are earned only by passing an assignment (mark of at least
     * {@link com.academy.entity.Assignment#PASS_PERCENTAGE}%) after finishing every course it is
     * linked to (lessons + published quizzes). One certificate per student and assignment, printed
     * with the assignment's certificate title. Returns the existing certificate if there is one;
     * throws {@code BadRequestException} when the requirements are not met.
     */
    CertificateResponse issueForAssignment(User user, com.academy.entity.Assignment assignment);

    /**
     * Issues the certificates of assignments linked to this course that the student already passed
     * and whose courses are now all finished. Returns the certificates issued (possibly none).
     */
    java.util.List<CertificateResponse> issuePendingForCourse(User user, Course course);

    /** Instructor: list all certificates issued for their courses */
    PageResponse<CertificateResponse> getInstructorCertificates(int page, int size);

    /** Instructor: download a certificate from one of their courses */
    byte[] downloadCertificateByInstructor(UUID id);
}
