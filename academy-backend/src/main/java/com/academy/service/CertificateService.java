package com.academy.service;

import com.academy.dto.response.CertificateResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface CertificateService {

    PageResponse<CertificateResponse> getMyCertificates(int page, int size);

    CertificateResponse getCertificateById(UUID id);

    CertificateResponse verifyCertificate(String certificateNumber);

    byte[] downloadCertificate(UUID id);

    CertificateResponse generateCertificate(User user, Course course);

    /** Instructor: list all certificates issued for their courses */
    PageResponse<CertificateResponse> getInstructorCertificates(int page, int size);

    /** Instructor: download a certificate from one of their courses */
    byte[] downloadCertificateByInstructor(UUID id);

    /** Instructor: upload a certificate template image for a course */
    String uploadCertificateTemplate(UUID courseId, MultipartFile file);
}
