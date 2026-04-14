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
import com.academy.security.UserPrincipal;
import com.academy.service.CertificateService;
import com.academy.service.UserService;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
    private final UserService userService;

    // ── Colours matching the site's luxury theme ───────────────────────────────
    /** Deep maroon — primary brand colour */
    private static final DeviceRgb MAROON        = new DeviceRgb(107, 29, 42);
    /** Darker maroon for headers */
    private static final DeviceRgb MAROON_DARK   = new DeviceRgb(75, 18, 28);
    /** Gold accent */
    private static final DeviceRgb GOLD          = new DeviceRgb(197, 151, 62);
    /** Light gold / cream */
    private static final DeviceRgb GOLD_LIGHT    = new DeviceRgb(245, 235, 200);
    /** Off-white background */
    private static final DeviceRgb BG_CREAM      = new DeviceRgb(252, 248, 240);
    /** Muted text */
    private static final DeviceRgb GRAY_MID      = new DeviceRgb(120, 100, 90);

    // ── Student methods ────────────────────────────────────────────────────────

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

    // ── Auto-generation (called from EnrollmentServiceImpl on course completion) ─

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CertificateResponse generateCertificate(User user, Course course) {
        // Return existing certificate if already issued — prevent duplicates
        if (certificateRepository.existsByUserAndCourse(user, course)) {
            Certificate existing = certificateRepository.findByUserAndCourse(user, course)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Certificate", "user and course", null));
            return CertificateResponse.fromEntity(existing);
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

    // ── Instructor methods ─────────────────────────────────────────────────────

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

    // ── PDF generation — luxury site-matching design ───────────────────────────

    private byte[] generatePdf(Certificate certificate) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));

        // Landscape A4  (841.9 × 595.3 pt)
        PageSize landscape = PageSize.A4.rotate();
        pdfDoc.addNewPage(landscape);

        float W = landscape.getWidth();   // ~841.9
        float H = landscape.getHeight();  // ~595.3

        PdfCanvas pdfCanvas = new PdfCanvas(pdfDoc.getFirstPage());
        Canvas canvas = new Canvas(pdfCanvas, landscape);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String completionDateStr = certificate.getCompletionDate() != null
                ? certificate.getCompletionDate().format(fmt) : "N/A";

        // ── 1. Background fill — cream ──────────────────────────────────────
        pdfCanvas.setFillColor(BG_CREAM)
                 .rectangle(0, 0, W, H)
                 .fill();

        // ── 2. Left maroon accent strip (≈28% width) ───────────────────────
        float stripW = W * 0.28f;
        pdfCanvas.setFillColor(MAROON_DARK)
                 .rectangle(0, 0, stripW, H)
                 .fill();

        // ── 3. Gold vertical ribbons on the strip ──────────────────────────
        float ribbonW = 12f;
        float ribbonGap = 20f;
        float ribbonX = stripW * 0.55f;
        // Three ribbons, decreasing height
        float[] ribbonHeights = { H * 0.72f, H * 0.60f, H * 0.48f };
        for (int i = 0; i < 3; i++) {
            pdfCanvas.setFillColor(GOLD)
                     .rectangle(ribbonX + i * (ribbonW + ribbonGap),
                                H - ribbonHeights[i],
                                ribbonW, ribbonHeights[i])
                     .fill();
        }

        // ── 4. Gold medal / rosette on strip ──────────────────────────────
        float medalCX = stripW * 0.40f;
        float medalCY = H * 0.32f;
        float medalR  = 52f;
        // Outer spiky ring (drawn as larger circle)
        pdfCanvas.setFillColor(GOLD)
                 .circle(medalCX, medalCY, medalR + 10)
                 .fill();
        // Inner circle
        pdfCanvas.setFillColor(GOLD_LIGHT)
                 .circle(medalCX, medalCY, medalR - 6)
                 .fill();

        // ── 5. Outer decorative border on the right panel ─────────────────
        float borderInset = 14f;
        float rightPanelX = stripW + borderInset;
        float rightPanelW = W - stripW - borderInset * 2;
        pdfCanvas.setStrokeColor(GOLD)
                 .setLineWidth(2f)
                 .rectangle(rightPanelX, borderInset, rightPanelW, H - borderInset * 2)
                 .stroke();
        // Thin inner border
        pdfCanvas.setStrokeColor(GOLD)
                 .setLineWidth(0.5f)
                 .rectangle(rightPanelX + 7, borderInset + 7,
                            rightPanelW - 14, H - borderInset * 2 - 14)
                 .stroke();

        // ── 6. Site logo / name on the strip ──────────────────────────────
        canvas.add(new Paragraph("SARALOWE")
                .setFontColor(GOLD)
                .setFontSize(14f)
                .setBold()
                .setCharacterSpacing(4f)
                .setFixedPosition(0, H * 0.82f, stripW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("ACADEMY")
                .setFontColor(GOLD_LIGHT)
                .setFontSize(8f)
                .setCharacterSpacing(5f)
                .setFixedPosition(0, H * 0.77f, stripW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 7. "CERTIFICATE" heading ───────────────────────────────────────
        float contentX = stripW + 32f;
        float contentW = W - stripW - 64f;

        canvas.add(new Paragraph("CERTIFICATE")
                .setFontColor(MAROON_DARK)
                .setFontSize(40f)
                .setBold()
                .setCharacterSpacing(8f)
                .setFixedPosition(contentX, H - 110f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("OF COMPLETION")
                .setFontColor(GOLD)
                .setFontSize(13f)
                .setCharacterSpacing(5f)
                .setFixedPosition(contentX, H - 133f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 8. "This certificate is proudly presented to" ─────────────────
        canvas.add(new Paragraph("This certificate is proudly presented to")
                .setFontColor(GRAY_MID)
                .setFontSize(11f)
                .setFixedPosition(contentX, H - 175f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 9. Student name (script style — italic bold) ──────────────────
        canvas.add(new Paragraph(certificate.getStudentName())
                .setFontColor(MAROON)
                .setFontSize(36f)
                .setBold()
                .setItalic()
                .setFixedPosition(contentX, H - 228f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // Gold underline below student name
        float lineY = H - 238f;
        float lineHalfW = Math.min(contentW * 0.42f, 200f);
        float lineCX = contentX + contentW / 2f;
        pdfCanvas.setStrokeColor(GOLD)
                 .setLineWidth(1.2f)
                 .moveTo(lineCX - lineHalfW, lineY)
                 .lineTo(lineCX + lineHalfW, lineY)
                 .stroke();

        // ── 10. "has successfully completed" ─────────────────────────────
        canvas.add(new Paragraph("has successfully completed the course")
                .setFontColor(GRAY_MID)
                .setFontSize(11f)
                .setFixedPosition(contentX, H - 263f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 11. Course title ──────────────────────────────────────────────
        canvas.add(new Paragraph(certificate.getCourseTitle())
                .setFontColor(MAROON_DARK)
                .setFontSize(20f)
                .setBold()
                .setFixedPosition(contentX, H - 295f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 12. Completion date ────────────────────────────────────────────
        canvas.add(new Paragraph("Completed on  " + completionDateStr)
                .setFontColor(GRAY_MID)
                .setFontSize(10f)
                .setFixedPosition(contentX, H - 320f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 13. Signature table ───────────────────────────────────────────
        float sigY = borderInset + 55f;
        float sigW = contentW * 0.75f;
        float sigX = contentX + (contentW - sigW) / 2f;

        // Two signature lines
        float sig1X = sigX + sigW * 0.05f;
        float sig2X = sigX + sigW * 0.55f;
        float sigLineW = sigW * 0.38f;

        pdfCanvas.setStrokeColor(MAROON)
                 .setLineWidth(0.8f)
                 .moveTo(sig1X, sigY + 18f).lineTo(sig1X + sigLineW, sigY + 18f).stroke()
                 .moveTo(sig2X, sigY + 18f).lineTo(sig2X + sigLineW, sigY + 18f).stroke();

        canvas.add(new Paragraph(certificate.getInstructorName())
                .setFontColor(MAROON_DARK).setFontSize(10f).setBold()
                .setFixedPosition(sig1X, sigY + 1f, sigLineW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("Course Instructor")
                .setFontColor(GRAY_MID).setFontSize(8f)
                .setCharacterSpacing(1f)
                .setFixedPosition(sig1X, sigY - 11f, sigLineW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("Saralowe Academy")
                .setFontColor(MAROON_DARK).setFontSize(10f).setBold()
                .setFixedPosition(sig2X, sigY + 1f, sigLineW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("Academy Director")
                .setFontColor(GRAY_MID).setFontSize(8f)
                .setCharacterSpacing(1f)
                .setFixedPosition(sig2X, sigY - 11f, sigLineW)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 14. Certificate number & verify URL ────────────────────────────
        canvas.add(new Paragraph("Certificate No: " + certificate.getCertificateNumber())
                .setFontColor(GRAY_MID).setFontSize(8f)
                .setFixedPosition(contentX, borderInset + 20f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("Verify at: saralowe.academy/verify/" + certificate.getCertificateNumber())
                .setFontColor(GOLD).setFontSize(7.5f)
                .setFixedPosition(contentX, borderInset + 10f, contentW)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.close();
        pdfDoc.close();
        return baos.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

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
