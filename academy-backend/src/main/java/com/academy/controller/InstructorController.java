package com.academy.controller;

import com.academy.dto.request.*;
import com.academy.dto.response.*;
import com.academy.entity.enums.PostType;
import com.academy.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/instructor")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
@Tag(name = "Instructor", description = "Instructor management endpoints")
public class InstructorController {

    private final InstructorService instructorService;
    private final CourseService courseService;
    private final ModuleService moduleService;
    private final LessonService lessonService;
    private final EnrollmentService enrollmentService;
    private final CommunityService communityService;
    private final CertificateService certificateService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get instructor dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse.InstructorDashboard>> getDashboard() {
        DashboardResponse.InstructorDashboard response = instructorService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Course Management
    @GetMapping("/courses")
    @Operation(summary = "Get instructor's courses")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getMyCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<CourseResponse> response = courseService.getInstructorCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/courses")
    @Operation(summary = "Create a new course")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CreateCourseRequest request) {
        CourseResponse response = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success("Course created", response));
    }

    @PutMapping("/courses/{id}")
    @Operation(summary = "Update a course")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCourseRequest request) {

        CourseResponse response = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated", response));
    }

    @DeleteMapping("/courses/{id}")
    @Operation(summary = "Delete a course")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted"));
    }

    @PostMapping("/courses/{id}/publish")
    @Operation(summary = "Submit course for review/publish")
    public ResponseEntity<ApiResponse<Void>> publishCourse(@PathVariable UUID id) {
        courseService.publishCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course submitted for review"));
    }

    @PostMapping("/courses/{id}/thumbnail")
    @Operation(summary = "Upload course thumbnail")
    public ResponseEntity<ApiResponse<String>> uploadThumbnail(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {

        String thumbnailUrl = courseService.uploadThumbnail(id, file);
        return ResponseEntity.ok(ApiResponse.success("Thumbnail uploaded", thumbnailUrl));
    }

    // Module Management
    @GetMapping("/courses/{courseId}/modules")
    @Operation(summary = "Get modules for a course")
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getModules(@PathVariable UUID courseId) {
        List<ModuleResponse> response = moduleService.getModulesByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/courses/{courseId}/modules")
    @Operation(summary = "Create a module")
    public ResponseEntity<ApiResponse<ModuleResponse>> createModule(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateModuleRequest request) {

        ModuleResponse response = moduleService.createModule(courseId, request);
        return ResponseEntity.ok(ApiResponse.success("Module created", response));
    }

    @PutMapping("/modules/{id}")
    @Operation(summary = "Update a module")
    public ResponseEntity<ApiResponse<ModuleResponse>> updateModule(
            @PathVariable UUID id,
            @Valid @RequestBody CreateModuleRequest request) {

        ModuleResponse response = moduleService.updateModule(id, request);
        return ResponseEntity.ok(ApiResponse.success("Module updated", response));
    }

    @DeleteMapping("/modules/{id}")
    @Operation(summary = "Delete a module")
    public ResponseEntity<ApiResponse<Void>> deleteModule(@PathVariable UUID id) {
        moduleService.deleteModule(id);
        return ResponseEntity.ok(ApiResponse.success("Module deleted"));
    }

    @PutMapping("/courses/{courseId}/modules/reorder")
    @Operation(summary = "Reorder modules within a course")
    public ResponseEntity<ApiResponse<Void>> reorderModules(
            @PathVariable UUID courseId,
            @RequestBody List<UUID> moduleIds) {
        moduleService.reorderModules(courseId, moduleIds);
        return ResponseEntity.ok(ApiResponse.success("Modules reordered"));
    }

    // Lesson Management
    @PostMapping("/modules/{moduleId}/lessons")
    @Operation(summary = "Create a lesson")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable UUID moduleId,
            @Valid @RequestBody CreateLessonRequest request) {

        LessonResponse response = lessonService.createLesson(moduleId, request);
        return ResponseEntity.ok(ApiResponse.success("Lesson created", response));
    }

    @PutMapping("/lessons/{id}")
    @Operation(summary = "Update a lesson")
    public ResponseEntity<ApiResponse<LessonResponse>> updateLesson(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLessonRequest request) {

        LessonResponse response = lessonService.updateLesson(id, request);
        return ResponseEntity.ok(ApiResponse.success("Lesson updated", response));
    }

    @DeleteMapping("/lessons/{id}")
    @Operation(summary = "Delete a lesson")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID id) {
        lessonService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted"));
    }

    @PostMapping("/lessons/{id}/upload-video")
    @Operation(summary = "Get video upload URL for a lesson (direct upload to Mux)")
    public ResponseEntity<ApiResponse<String>> initiateVideoUpload(@PathVariable UUID id) {
        String uploadUrl = lessonService.initiateVideoUpload(id);
        return ResponseEntity.ok(ApiResponse.success("Upload URL generated", uploadUrl));
    }

    @PostMapping("/lessons/{id}/video")
    @Operation(summary = "Upload video file for a lesson (server-side upload to Mux)")
    public ResponseEntity<ApiResponse<Void>> uploadVideo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        lessonService.uploadVideo(id, file);
        return ResponseEntity.ok(ApiResponse.success("Video upload started. Processing will begin shortly."));
    }

    // Students
    @GetMapping("/students")
    @Operation(summary = "Get instructor's students (paginated, with optional search)")
    public ResponseEntity<ApiResponse<PageResponse<InstructorStudentResponse>>> getMyStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        PageResponse<InstructorStudentResponse> response = enrollmentService.getMyStudents(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/students/{studentId}")
    @Operation(summary = "Get detailed profile of a specific student")
    public ResponseEntity<ApiResponse<InstructorStudentDetailResponse>> getStudentDetail(
            @PathVariable UUID studentId) {
        InstructorStudentDetailResponse response = enrollmentService.getStudentDetail(studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/courses/{id}/students")
    @Operation(summary = "Get students enrolled in a course")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentResponse>>> getCourseStudents(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<EnrollmentResponse> response = enrollmentService.getCourseStudents(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Announcements
    @GetMapping("/announcements")
    @Operation(summary = "Get instructor's announcements")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getMyAnnouncements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<PostResponse> response = communityService.getMyAnnouncements(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/announcements")
    @Operation(summary = "Create an announcement")
    public ResponseEntity<ApiResponse<PostResponse>> createAnnouncement(
            @Valid @RequestBody CreatePostRequest request) {
        request.setPostType(PostType.ANNOUNCEMENT);
        PostResponse response = communityService.createPost(request);
        return ResponseEntity.ok(ApiResponse.success("Announcement created", response));
    }

    @PutMapping("/announcements/{id}")
    @Operation(summary = "Update an announcement")
    public ResponseEntity<ApiResponse<PostResponse>> updateAnnouncement(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePostRequest request) {
        request.setPostType(PostType.ANNOUNCEMENT);
        PostResponse response = communityService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated", response));
    }

    @DeleteMapping("/announcements/{id}")
    @Operation(summary = "Delete an announcement")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable UUID id) {
        communityService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted"));
    }

    // ── Earnings ─────────────────────────────────────────────────────────────

    @GetMapping("/earnings/summary")
    @Operation(summary = "Get earnings summary (totals + last-12-months breakdown)")
    public ResponseEntity<ApiResponse<EarningsSummaryResponse>> getEarningsSummary() {
        EarningsSummaryResponse response = instructorService.getEarningsSummary();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/earnings")
    @Operation(summary = "Get paginated earnings list")
    public ResponseEntity<ApiResponse<PageResponse<EarningResponse>>> getEarnings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<EarningResponse> response = instructorService.getEarnings(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/payouts")
    @Operation(summary = "Get payout history")
    public ResponseEntity<ApiResponse<PageResponse<PayoutResponse>>> getPayouts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PayoutResponse> response = instructorService.getPayouts(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/payouts/request")
    @Operation(summary = "Request a payout")
    public ResponseEntity<ApiResponse<PayoutResponse>> requestPayout(
            @Valid @RequestBody RequestPayoutRequest request) {
        PayoutResponse payout = instructorService.requestPayout(request);
        return ResponseEntity.ok(ApiResponse.success("Payout requested successfully", payout));
    }

    // ── Certificates ────────────────────────────────────────────────────────

    @GetMapping("/certificates")
    @Operation(summary = "Get all certificates issued for instructor's courses")
    public ResponseEntity<ApiResponse<PageResponse<CertificateResponse>>> getInstructorCertificates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CertificateResponse> response = certificateService.getInstructorCertificates(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/certificates/{id}/download")
    @Operation(summary = "Download a certificate PDF (instructor access)")
    public ResponseEntity<byte[]> downloadCertificateByInstructor(@PathVariable UUID id) {
        byte[] pdfBytes = certificateService.downloadCertificateByInstructor(id);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/courses/{courseId}/certificate-template")
    @Operation(summary = "Upload or replace the certificate template image for a course")
    public ResponseEntity<ApiResponse<String>> uploadCertificateTemplate(
            @PathVariable UUID courseId,
            @RequestParam("file") MultipartFile file) {
        String templateUrl = certificateService.uploadCertificateTemplate(courseId, file);
        return ResponseEntity.ok(ApiResponse.success("Certificate template uploaded", templateUrl));
    }
}
