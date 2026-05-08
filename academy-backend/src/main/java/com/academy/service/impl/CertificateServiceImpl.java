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

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Canvas;
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
import java.io.InputStream;
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

    // ── Saralöwe brand colours (matching the pink certificate PDF) ────────────
    /** Blush pink background — matches PDF background */
    private static final DeviceRgb PINK_BG  = new DeviceRgb(252, 230, 232);
    /** Deep crimson — the primary brand colour */
    private static final DeviceRgb CRIMSON  = new DeviceRgb(157, 28, 52);
    /** Darker crimson for the ribbon shadow layer */
    private static final DeviceRgb CRIM_DK  = new DeviceRgb(120, 18, 36);
    /** Pure white — for text inside the crimson ribbon */
    private static final DeviceRgb WHITE    = new DeviceRgb(255, 255, 255);
    /** Light pink — for decorative lines / muted elements */
    private static final DeviceRgb PINK_LT  = new DeviceRgb(240, 185, 195);

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

    // ── Auto-generation ────────────────────────────────────────────────────────

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CertificateResponse generateCertificate(User user, Course course) {
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

    // ── PDF generation — Saralöwe pink certificate style ──────────────────────

    private byte[] generatePdf(Certificate certificate) throws Exception {

        ByteArrayOutputStream baos    = new ByteArrayOutputStream();
        PdfDocument           pdfDoc  = new PdfDocument(new PdfWriter(baos));
        PageSize              page    = PageSize.A4;   // portrait 595.28 × 841.89 pt
        pdfDoc.addNewPage(page);

        final float W = page.getWidth();    // 595.28
        final float H = page.getHeight();   // 841.89

        PdfCanvas pdfCanvas = new PdfCanvas(pdfDoc.getFirstPage());
        Canvas    canvas    = new Canvas(pdfCanvas, page);

        // -- Load fonts from classpath (src/main/resources/fonts/) -------------
        PdfFont scriptFont = loadFont("/fonts/GreatVibes-Regular.ttf");   // "Certificate" script
        PdfFont cinzelFont = loadFont("/fonts/Cinzel-Regular.ttf");        // small-caps headers
        PdfFont latoFont   = loadFont("/fonts/Lato-Regular.ttf");          // body text
        PdfFont latoItalic = loadFont("/fonts/Lato-Italic.ttf");           // italic body

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String dateStr = certificate.getCompletionDate() != null
                ? certificate.getCompletionDate().format(fmt) : "N/A";

        String instructorDisplay = (certificate.getInstructorName() != null
                && !certificate.getInstructorName().isBlank())
                ? certificate.getInstructorName()
                : "Saralöwe Academy";

        // ── 1. Blush pink background ──────────────────────────────────────────
        pdfCanvas.setFillColor(PINK_BG)
                .rectangle(0, 0, W, H)
                .fill();

        // ── 2. Crimson ribbon band (top of page, wavy bottom edge) ────────────
        float bandBot = H - 180f;   // y of band's bottom edge at centre

        pdfCanvas.setFillColor(CRIMSON);
        pdfCanvas.moveTo(0, H);                                       // top-left corner
        pdfCanvas.lineTo(W, H);                                       // top-right corner
        pdfCanvas.lineTo(W, bandBot + 45f);                           // right side down
        pdfCanvas.curveTo(W * 0.88f, bandBot + 18f,                  // — right wave
                          W * 0.65f, bandBot + 36f,
                          W * 0.50f, bandBot + 12f);                  // centre dip
        pdfCanvas.curveTo(W * 0.35f, bandBot - 12f,                  // — left wave
                          W * 0.12f, bandBot + 22f,
                          0f,        bandBot + 45f);                  // left side back up
        pdfCanvas.closePath();
        pdfCanvas.fill();

        // ── 3. Left Art-Nouveau swirl ─────────────────────────────────────────
        // Large circle mostly off the left edge (visible half creates the knot)
        float swirlCX = -18f;
        float swirlCY = H - 148f;
        float swirlR  = 75f;

        // Outer ring fill
        pdfCanvas.setFillColor(CRIMSON);
        pdfCanvas.circle(swirlCX, swirlCY, swirlR);
        pdfCanvas.fill();
        // Pink cutout to make a ring
        pdfCanvas.setFillColor(PINK_BG);
        pdfCanvas.circle(swirlCX, swirlCY, swirlR - 20f);
        pdfCanvas.fill();
        // Inner crimson dot
        pdfCanvas.setFillColor(CRIMSON);
        pdfCanvas.circle(swirlCX, swirlCY, swirlR - 34f);
        pdfCanvas.fill();

        // Ribbon tail sweeping right from the left swirl
        pdfCanvas.setStrokeColor(CRIMSON)
                .setLineWidth(18f)
                .setLineCapStyle(1)  // round caps
                .moveTo(swirlCX + swirlR - 8f, swirlCY - 20f)
                .curveTo(80f, H - 178f, 110f, H - 210f, 80f, H - 240f)
                .curveTo(50f, H - 270f, 20f, H - 255f, 35f, H - 290f)
                .stroke();

        // ── 4. Right Art-Nouveau swirl (mirror) ───────────────────────────────
        float swirlCXR = W + 18f;

        pdfCanvas.setFillColor(CRIMSON);
        pdfCanvas.circle(swirlCXR, swirlCY, swirlR);
        pdfCanvas.fill();
        pdfCanvas.setFillColor(PINK_BG);
        pdfCanvas.circle(swirlCXR, swirlCY, swirlR - 20f);
        pdfCanvas.fill();
        pdfCanvas.setFillColor(CRIMSON);
        pdfCanvas.circle(swirlCXR, swirlCY, swirlR - 34f);
        pdfCanvas.fill();

        pdfCanvas.setStrokeColor(CRIMSON)
                .setLineWidth(18f)
                .setLineCapStyle(1)
                .moveTo(swirlCXR - swirlR + 8f, swirlCY - 20f)
                .curveTo(W - 80f, H - 178f, W - 110f, H - 210f, W - 80f, H - 240f)
                .curveTo(W - 50f, H - 270f, W - 20f, H - 255f, W - 35f, H - 290f)
                .stroke();

        // ── 5. Logo text inside the ribbon ────────────────────────────────────
        // "COUTURE PASTRY" — small tracked caps
        canvas.add(new Paragraph("COUTURE PASTRY")
                .setFont(cinzelFont).setFontColor(WHITE)
                .setFontSize(9f).setCharacterSpacing(4.5f)
                .setFixedPosition(0, H - 72f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // "SARALÖWE" — large display
        canvas.add(new Paragraph("SARALÖWE")
                .setFont(cinzelFont).setFontColor(WHITE)
                .setFontSize(46f).setBold().setCharacterSpacing(4f)
                .setFixedPosition(0, H - 128f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // "CRAFTED BY SCIENCE, ELEVATED BY ART!"
        canvas.add(new Paragraph("CRAFTED BY SCIENCE, ELEVATED BY ART!")
                .setFont(cinzelFont).setFontColor(WHITE)
                .setFontSize(7.5f).setCharacterSpacing(2.8f)
                .setFixedPosition(0, H - 148f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 6. "Certificate" script ───────────────────────────────────────────
        canvas.add(new Paragraph("Certificate")
                .setFont(scriptFont).setFontColor(CRIMSON)
                .setFontSize(78f)
                .setFixedPosition(0, H - 278f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // "ISSUED BY   SARALÖWE ACADEMY" — small caps with wider spacing
        canvas.add(new Paragraph("ISSUED BY   SARALÖWE ACADEMY")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(9.5f).setCharacterSpacing(2.5f)
                .setFixedPosition(0, H - 296f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 7. Thin decorative rule ───────────────────────────────────────────
        float ruleY = H - 322f;
        float ruleW = 370f;
        float ruleCX = W / 2f;
        pdfCanvas.setStrokeColor(CRIMSON)
                .setLineWidth(0.6f)
                .moveTo(ruleCX - ruleW / 2f, ruleY)
                .lineTo(ruleCX + ruleW / 2f, ruleY)
                .stroke();

        // Tiny diamond ornament at centre of rule
        float dX = ruleCX, dY = ruleY;
        float dS = 4f;
        pdfCanvas.setFillColor(CRIMSON)
                .moveTo(dX, dY + dS)
                .lineTo(dX + dS, dY)
                .lineTo(dX, dY - dS)
                .lineTo(dX - dS, dY)
                .closePath()
                .fill();

        // ── 8. "THIS CERTIFICATE IS AWARDED TO" ──────────────────────────────
        canvas.add(new Paragraph("THIS CERTIFICATE IS AWARDED TO")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(11.5f).setCharacterSpacing(2.5f)
                .setFixedPosition(0, H - 368f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 9. Student name (script, sitting on a rule line) ─────────────────
        float nameLineY = H - 400f;
        float nameLineW = 430f;
        pdfCanvas.setStrokeColor(CRIMSON)
                .setLineWidth(0.7f)
                .moveTo((W - nameLineW) / 2f, nameLineY)
                .lineTo((W + nameLineW) / 2f, nameLineY)
                .stroke();

        // Name text — baseline sits just above the rule
        canvas.add(new Paragraph(certificate.getStudentName())
                .setFont(scriptFont).setFontColor(CRIMSON)
                .setFontSize(42f)
                .setFixedPosition(0, nameLineY + 2f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 10. Recognition paragraph ─────────────────────────────────────────
        canvas.add(new Paragraph("IN RECOGNITION OF THE DEDICATION, DISCIPLINE, AND")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(9.5f).setCharacterSpacing(1.8f)
                .setFixedPosition(0, H - 460f, W)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.add(new Paragraph("ARTISTRY DEMONSTRATED THROUGHOUT THE")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(9.5f).setCharacterSpacing(1.8f)
                .setFixedPosition(0, H - 476f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // Course name in bold
        String courseUpper = certificate.getCourseTitle().toUpperCase() + " COURSE";
        canvas.add(new Paragraph(courseUpper)
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(10f).setBold().setCharacterSpacing(1.5f)
                .setFixedPosition(0, H - 494f, W)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 11. Fields — script label + horizontal rule + filled value ─────────
        float labelX   = 68f;
        float lineStartX = 190f;
        float lineEndX   = W - 68f;
        float lineWF     = lineEndX - lineStartX;

        // Course field
        float courseY = H - 548f;
        canvas.add(new Paragraph("Course :")
                .setFont(scriptFont).setFontColor(CRIMSON).setFontSize(24f)
                .setFixedPosition(labelX, courseY, 115f));
        pdfCanvas.setStrokeColor(CRIMSON).setLineWidth(0.5f)
                .moveTo(lineStartX, courseY + 6f)
                .lineTo(lineEndX,   courseY + 6f)
                .stroke();
        canvas.add(new Paragraph(certificate.getCourseTitle())
                .setFont(latoFont).setFontColor(CRIMSON).setFontSize(10.5f)
                .setFixedPosition(lineStartX + 6f, courseY + 8f, lineWF - 12f));

        // Instructor field
        float instrY = H - 588f;
        canvas.add(new Paragraph("Instructor :")
                .setFont(scriptFont).setFontColor(CRIMSON).setFontSize(24f)
                .setFixedPosition(labelX, instrY, 130f));
        pdfCanvas.setStrokeColor(CRIMSON).setLineWidth(0.5f)
                .moveTo(lineStartX, instrY + 6f)
                .lineTo(lineEndX,   instrY + 6f)
                .stroke();
        canvas.add(new Paragraph(instructorDisplay)
                .setFont(latoFont).setFontColor(CRIMSON).setFontSize(10.5f)
                .setFixedPosition(lineStartX + 6f, instrY + 8f, lineWF - 12f));

        // Date field
        float dateFieldY = H - 628f;
        canvas.add(new Paragraph("Date :")
                .setFont(scriptFont).setFontColor(CRIMSON).setFontSize(24f)
                .setFixedPosition(labelX, dateFieldY, 100f));
        pdfCanvas.setStrokeColor(CRIMSON).setLineWidth(0.5f)
                .moveTo(lineStartX, dateFieldY + 6f)
                .lineTo(lineEndX,   dateFieldY + 6f)
                .stroke();
        canvas.add(new Paragraph(dateStr)
                .setFont(latoFont).setFontColor(CRIMSON).setFontSize(10.5f)
                .setFixedPosition(lineStartX + 6f, dateFieldY + 8f, lineWF - 12f));

        // ── 12. Bottom-left: instructor signature block ───────────────────────
        float sigY = 100f;
        canvas.add(new Paragraph(instructorDisplay.toUpperCase())
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(9.5f).setBold().setCharacterSpacing(1f)
                .setFixedPosition(50f, sigY + 16f, 220f)
                .setTextAlignment(TextAlignment.LEFT));
        canvas.add(new Paragraph("COURSE INSTRUCTOR")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(8f).setCharacterSpacing(1.5f)
                .setFixedPosition(50f, sigY, 220f)
                .setTextAlignment(TextAlignment.LEFT));

        // ── 13. Bottom-right: Saralöwe Academy circular seal ─────────────────
        float sealCX = W - 95f;
        float sealCY = sigY + 45f;
        float sealR  = 52f;

        // Outer ring
        pdfCanvas.setStrokeColor(CRIMSON).setLineWidth(2f)
                .circle(sealCX, sealCY, sealR)
                .stroke();
        // Inner ring
        pdfCanvas.setStrokeColor(CRIMSON).setLineWidth(0.6f)
                .circle(sealCX, sealCY, sealR - 9f)
                .stroke();

        // Seal text
        canvas.add(new Paragraph("SARALÖWE")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(9f).setBold().setCharacterSpacing(1.2f)
                .setFixedPosition(sealCX - sealR + 4f, sealCY + 5f, (sealR - 4f) * 2f)
                .setTextAlignment(TextAlignment.CENTER));
        canvas.add(new Paragraph("ACADEMY")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(7.5f).setCharacterSpacing(2f)
                .setFixedPosition(sealCX - sealR + 4f, sealCY - 8f, (sealR - 4f) * 2f)
                .setTextAlignment(TextAlignment.CENTER));
        canvas.add(new Paragraph("★  EST. 2010  ★")
                .setFont(cinzelFont).setFontColor(CRIMSON)
                .setFontSize(6.5f)
                .setFixedPosition(sealCX - sealR + 4f, sealCY - 22f, (sealR - 4f) * 2f)
                .setTextAlignment(TextAlignment.CENTER));

        // ── 14. Certificate number at very bottom ─────────────────────────────
        canvas.add(new Paragraph("Certificate No: " + certificate.getCertificateNumber())
                .setFont(latoFont).setFontColor(CRIMSON)
                .setFontSize(7.5f)
                .setFixedPosition(0, 32f, W)
                .setTextAlignment(TextAlignment.CENTER));

        canvas.close();
        pdfDoc.close();
        return baos.toByteArray();
    }

    // ── Font loader helper ─────────────────────────────────────────────────────

    private PdfFont loadFont(String classpathResource) throws Exception {
        try (InputStream is = getClass().getResourceAsStream(classpathResource)) {
            if (is == null) {
                log.warn("Font not found on classpath: {} — falling back to Helvetica", classpathResource);
                return PdfFontFactory.createFont();
            }
            byte[] bytes = is.readAllBytes();
            return PdfFontFactory.createFont(bytes, PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
        }
    }

    // ── Misc helpers ───────────────────────────────────────────────────────────

    private String generateCertificateNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random    = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "CDA-" + timestamp.substring(timestamp.length() - 6) + "-" + random;
    }

    private Certificate findById(UUID id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));
    }

    private User getCurrentUser() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(principal.getId());
    }
}
