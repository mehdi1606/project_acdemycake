package com.academy.service.impl;

import com.academy.dto.response.CertificateResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Certificate;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CertificateRepository;
import com.academy.repository.CourseRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CertificateService;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final FileStorageService fileStorageService;
    private final UserService userService;

    // ── Student methods ────────────────────────────────────────────────────

    @Override
    public PageResponse<CertificateResponse> getMyCertificates(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Certificate> certificatesPage =
                certificateRepository.findByUserOrderByIssuedAtDesc(currentUser, pageable);
        return PageResponse.from(certificatesPage, CertificateResponse::fromEntity);
    }

    @Override
    public CertificateResponse getCertificateById(UUID id) {
        User currentUser = getCurrentUser();
        Certificate certificate = findById(id);

        if (!certificate.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have access to this certificate");
        }

        return CertificateResponse.fromEntity(certificate);
    }

    @Override
    public CertificateResponse verifyCertificate(String certificateNumber) {
        Certificate certificate = certificateRepository.findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Certificate", "certificateNumber", certificateNumber));
        return CertificateResponse.fromEntity(certificate);
    }

    @Override
    public byte[] downloadCertificate(UUID id) {
        User currentUser = getCurrentUser();
        Certificate certificate = findById(id);

        if (!certificate.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have access to this certificate");
        }

        try {
            return generatePdf(certificate);
        } catch (Exception e) {
            log.error("Failed to generate certificate PDF: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to generate certificate PDF");
        }
    }

    // ── Auto-generation (called from EnrollmentServiceImpl) ───────────────

    @Override
    @Transactional
    public CertificateResponse generateCertificate(User user, Course course) {
        // Return existing certificate if already issued
        if (certificateRepository.existsByUserAndCourse(user, course)) {
            Certificate existing = certificateRepository.findByUserAndCourse(user, course)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Certificate", "user and course", null));
            return CertificateResponse.fromEntity(existing);
        }

        // Certificate generation requires an instructor-uploaded template
        if (course.getCertificateTemplatePath() == null
                || course.getCertificateTemplatePath().isBlank()) {
            log.info("No certificate template set for course '{}' — skipping generation.",
                    course.getTitle());
            throw new BadRequestException(
                    "No certificate template uploaded for course: " + course.getTitle()
                    + ". Please upload a template from the Certificates section.");
        }

        String certificateNumber = generateCertificateNumber();

        Certificate certificate = Certificate.builder()
                .user(user)
                .course(course)
                .certificateNumber(certificateNumber)
                .studentName(user.getFullName())
                .courseTitle(course.getTitle())
                .instructorName(course.getInstructor().getFullName())
                .completionDate(LocalDateTime.now())
                .issuedAt(LocalDateTime.now())
                .build();

        certificate = certificateRepository.save(certificate);
        log.info("Certificate generated: {} for user: {} course: {}",
                certificateNumber, user.getEmail(), course.getTitle());

        return CertificateResponse.fromEntity(certificate);
    }

    // ── Instructor methods ─────────────────────────────────────────────────

    @Override
    public PageResponse<CertificateResponse> getInstructorCertificates(int page, int size) {
        User instructor = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Certificate> certs = certificateRepository.findByInstructor(instructor, pageable);
        return PageResponse.from(certs, CertificateResponse::fromEntity);
    }

    @Override
    public byte[] downloadCertificateByInstructor(UUID id) {
        User instructor = getCurrentUser();
        Certificate certificate = findById(id);

        if (!certificate.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have access to this certificate");
        }

        try {
            return generatePdf(certificate);
        } catch (Exception e) {
            log.error("Failed to generate certificate PDF for instructor: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to generate certificate PDF");
        }
    }

    @Override
    @Transactional
    public String uploadCertificateTemplate(UUID courseId, MultipartFile file) {
        User instructor = getCurrentUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // Ownership check
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new ForbiddenException("You don't have permission to modify this course");
        }

        // Delete old template if one exists
        if (course.getCertificateTemplatePath() != null
                && !course.getCertificateTemplatePath().isBlank()) {
            try {
                fileStorageService.deleteFile(course.getCertificateTemplatePath());
            } catch (Exception e) {
                log.warn("Could not delete old certificate template: {}", e.getMessage());
            }
        }

        // Store the new template image
        String filePath = fileStorageService.storeFile(file, "certificate-templates");
        course.setCertificateTemplatePath(filePath);
        courseRepository.save(course);

        log.info("Certificate template uploaded for course '{}' by instructor '{}'",
                course.getTitle(), instructor.getEmail());

        return fileStorageService.getFileUrl(filePath);
    }

    // ── PDF generation ─────────────────────────────────────────────────────

    /**
     * Entry point: uses the instructor's template image if available,
     * otherwise falls back to the built-in decorative layout.
     */
    private byte[] generatePdf(Certificate certificate) throws Exception {
        String templatePath = certificate.getCourse().getCertificateTemplatePath();
        if (templatePath != null && !templatePath.isBlank()) {
            return generatePdfWithTemplate(certificate, templatePath);
        }
        return generatePdfDefault(certificate);
    }

    /**
     * Template-based PDF: loads the instructor's image as a full-page background
     * and writes the student's name (+ cert number) on top.
     */
    private byte[] generatePdfWithTemplate(Certificate certificate, String templatePath)
            throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));

        // Landscape A4
        Document document = new Document(pdf, PageSize.A4.rotate());
        document.setMargins(0, 0, 0, 0);

        float pageWidth  = PageSize.A4.rotate().getWidth();   // ~841.9 pt
        float pageHeight = PageSize.A4.rotate().getHeight();  // ~595.3 pt

        // ── Full-page background: instructor's template ──────────────────
        byte[] templateBytes = fileStorageService.loadFile(templatePath);
        Image bg = new Image(ImageDataFactory.create(templateBytes));
        bg.setFixedPosition(0, 0);
        bg.setWidth(pageWidth);
        bg.setHeight(pageHeight);
        document.add(bg);

        // ── Student name – centered at ~42 % from bottom ─────────────────
        DeviceRgb nameColor = new DeviceRgb(139, 69, 19);   // warm brown
        document.add(new Paragraph(certificate.getStudentName())
                .setFontSize(44)
                .setFontColor(nameColor)
                .setBold()
                .setFixedPosition(0, pageHeight * 0.42f, pageWidth)
                .setTextAlignment(TextAlignment.CENTER));

        // ── Certificate number – bottom center ────────────────────────────
        document.add(new Paragraph(
                "Certificate #: " + certificate.getCertificateNumber())
                .setFontSize(10)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setFixedPosition(10, 16, pageWidth - 20)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    /**
     * Fallback: built-in decorative layout used when no template has been set.
     */
    private byte[] generatePdfDefault(Certificate certificate) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));

        Document document = new Document(pdf, PageSize.A4.rotate());
        document.setMargins(40, 40, 40, 40);

        DeviceRgb primaryColor = new DeviceRgb(139, 69, 19);
        DeviceRgb goldColor    = new DeviceRgb(218, 165, 32);

        document.add(new Paragraph("CERTIFICATE OF COMPLETION")
                .setFontSize(32).setFontColor(primaryColor).setBold()
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

        document.add(new Paragraph("Cake Design Academy")
                .setFontSize(24).setFontColor(goldColor)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(10));

        document.add(new Paragraph("______________________________")
                .setFontSize(14).setFontColor(goldColor)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

        document.add(new Paragraph("This is to certify that")
                .setFontSize(16).setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

        document.add(new Paragraph(certificate.getStudentName())
                .setFontSize(36).setFontColor(primaryColor).setBold()
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(15));

        document.add(new Paragraph("has successfully completed the course")
                .setFontSize(16).setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

        document.add(new Paragraph(certificate.getCourseTitle())
                .setFontSize(28).setFontColor(primaryColor).setBold().setItalic()
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(15));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        document.add(new Paragraph(
                "Completed on " + certificate.getCompletionDate().format(formatter))
                .setFontSize(14).setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

        Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(80))
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setMarginTop(40);

        Cell instructorCell = new Cell()
                .add(new Paragraph("_______________________")
                        .setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph(certificate.getInstructorName())
                        .setTextAlignment(TextAlignment.CENTER).setBold())
                .add(new Paragraph("Course Instructor")
                        .setTextAlignment(TextAlignment.CENTER).setFontSize(10))
                .setBorder(Border.NO_BORDER);

        Cell academyCell = new Cell()
                .add(new Paragraph("_______________________")
                        .setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("Cake Design Academy")
                        .setTextAlignment(TextAlignment.CENTER).setBold())
                .add(new Paragraph("Academy Director")
                        .setTextAlignment(TextAlignment.CENTER).setFontSize(10))
                .setBorder(Border.NO_BORDER);

        signatureTable.addCell(instructorCell);
        signatureTable.addCell(academyCell);
        document.add(signatureTable);

        document.add(new Paragraph(
                "Certificate Number: " + certificate.getCertificateNumber())
                .setFontSize(10).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

        document.add(new Paragraph(
                "Verify at: cakedesign.academy/verify/" + certificate.getCertificateNumber())
                .setFontSize(10).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String generateCertificateNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "CDA-" + timestamp.substring(timestamp.length() - 6) + "-" + random;
    }

    private Certificate findById(UUID id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
