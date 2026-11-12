package com.academy.service.impl;

import com.academy.dto.request.CreateLessonRequest;
import com.academy.dto.request.UpdateLessonProgressRequest;
import com.academy.dto.response.LessonResourceResponse;
import com.academy.dto.response.LessonResponse;
import com.academy.dto.response.VideoUrlResponse;
import com.academy.entity.*;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.integration.mux.MuxService;
import com.academy.repository.CourseLessonRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.repository.VideoAssetRepository;
import com.academy.service.VideoStorageService;
import com.academy.service.VideoTokenService;
import com.academy.security.UserPrincipal;
import com.academy.service.EnrollmentService;
import com.academy.service.LessonService;
import com.academy.service.ModuleService;
import com.academy.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private static final long MAX_RESOURCE_SIZE = 50L * 1024 * 1024; // 50 MB
    private static final List<String> ALLOWED_RESOURCE_EXTENSIONS = Arrays.asList(
            "pdf", "doc", "docx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif"
    );

    private final CourseLessonRepository  lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final ModuleService            moduleService;
    private final UserService              userService;
    private final EnrollmentService        enrollmentService;
    private final MuxService               muxService;
    private final VideoStorageService      videoStorageService;
    private final VideoTokenService        videoTokenService;
    private final VideoAssetRepository     videoAssetRepository;
    private final ObjectMapper             objectMapper;
    private final com.academy.security.FileUrlSigner fileUrlSigner;
    private final com.academy.repository.QuizRepository quizRepository;

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.base-url}")
    private String fileBaseUrl;

    @Override
    public CourseLesson findById(UUID id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", id));
    }

    @Override
    public LessonResponse getLessonById(UUID id) {
        CourseLesson lesson = findById(id);
        Course course = lesson.getModule().getCourse();

        // Preview lessons are public; everything else requires enrolment or staff access
        if (!lesson.getIsPreview()) {
            User currentUser = getCurrentUser();
            // hasAccess covers admins and the course's own instructor.
            if (!enrollmentService.hasAccess(currentUser, course)) {
                throw new ForbiddenException("You must be enrolled in this course to view its lessons.");
            }
        }

        return LessonResponse.withContent(lesson, fileUrlSigner);
    }

    /**
     * A lesson with a published quiz is completed only by passing that quiz
     * (QuizServiceImpl.submitAttempt), never by a manual "mark complete".
     */
    private void requireNotQuizGated(CourseLesson lesson) {
        if (lesson.getContentType() != com.academy.entity.enums.ContentType.QUIZ) return;
        quizRepository.findByLessonId(lesson.getId())
                .filter(q -> q.getStatus() == com.academy.entity.enums.QuizStatus.PUBLISHED)
                .ifPresent(q -> { throw new BadRequestException("Pass the quiz to complete this lesson."); });
    }

    /**
     * The user's enrollment, created on the fly when they have access without one
     * (a subscriber opening a plan course directly, or the course owner). Without
     * this, saving progress failed with "Enrollment not found" and was rolled back.
     */
    private CourseEnrollment enrollmentFor(User user, Course course) {
        // Not via getEnrollment + catch: an exception thrown through the transactional
        // service marks the whole transaction rollback-only.
        var existing = enrollmentService.findEnrollment(user, course);
        if (existing.isPresent()) return existing.get();
        boolean planCourse = course.getCourseType() == null
                || course.getCourseType() == com.academy.entity.enums.CourseType.PLAN;
        enrollmentService.enrollUserInCourse(user, course,
                planCourse && user.hasActiveSubscription()
                        ? com.academy.entity.enums.EnrollmentType.SUBSCRIPTION
                        : com.academy.entity.enums.EnrollmentType.FREE);
        return enrollmentService.getEnrollment(user, course);
    }

    /** Removes script / event handlers and stale file-link signatures before storing. */
    private String cleanLessonHtml(String html) {
        return fileUrlSigner.stripReferencesIn(com.academy.security.HtmlSanitizer.clean(html));
    }

    @Override
    public List<LessonResponse> getLessonsByModule(UUID moduleId) {
        CourseModule module = moduleService.findById(moduleId);
        return lessonRepository.findByModuleOrderByOrderIndexAsc(module).stream()
                .map(LessonResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LessonResponse createLesson(UUID moduleId, CreateLessonRequest request) {
        CourseModule module = moduleService.findById(moduleId);
        verifyInstructorAccess(module.getCourse());

        Integer maxOrder = lessonRepository.findMaxOrderIndexByModule(module).orElse(-1);

        CourseLesson lesson = CourseLesson.builder()
                .module(module)
                .title(request.getTitle())
                .description(request.getDescription())
                .contentType(request.getContentType())
                .textContent(cleanLessonHtml(request.getTextContent()))
                .isPreview(request.getIsPreview() != null ? request.getIsPreview() : false)
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : maxOrder + 1)
                .isPublished(true)
                .videoStatus("pending")
                .build();

        lesson = lessonRepository.save(lesson);
        log.info("Lesson created: {} in module: {}", lesson.getTitle(), module.getTitle());

        return LessonResponse.withContent(lesson, fileUrlSigner);
    }

    @Override
    @Transactional
    public LessonResponse updateLesson(UUID lessonId, CreateLessonRequest request) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        if (request.getTitle() != null) {
            lesson.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
        if (request.getContentType() != null) {
            lesson.setContentType(request.getContentType());
        }
        if (request.getTextContent() != null) {
            lesson.setTextContent(cleanLessonHtml(request.getTextContent()));
        }
        if (request.getIsPreview() != null) {
            lesson.setIsPreview(request.getIsPreview());
        }
        if (request.getOrderIndex() != null) {
            lesson.setOrderIndex(request.getOrderIndex());
        }

        lesson = lessonRepository.save(lesson);
        log.info("Lesson updated: {}", lesson.getTitle());

        return LessonResponse.withContent(lesson, fileUrlSigner);
    }

    @Override
    @Transactional
    public void deleteLesson(UUID lessonId) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        if (lesson.getMuxAssetId() != null) {
            muxService.deleteAsset(lesson.getMuxAssetId());
        }

        // Delete local video file + asset record if present
        if (lesson.getVideoFilePath() != null) {
            videoStorageService.deleteVideo(lesson.getVideoFilePath());
            videoAssetRepository.deleteByLessonId(lessonId);
        }

        lessonRepository.delete(lesson);
        log.info("Lesson deleted: {}", lesson.getTitle());
    }

    @Override
    @Transactional
    public void reorderLessons(UUID moduleId, List<UUID> lessonIds) {
        if (lessonIds == null || lessonIds.stream().anyMatch(java.util.Objects::isNull)) {
            throw new com.academy.exception.BadRequestException("Invalid list of ids");
        }
        CourseModule module = moduleService.findById(moduleId);
        verifyInstructorAccess(module.getCourse());

        for (int i = 0; i < lessonIds.size(); i++) {
            CourseLesson lesson = findById(lessonIds.get(i));
            if (!lesson.getModule().getId().equals(module.getId())) {
                throw new BadRequestException("Lesson " + lesson.getId() + " does not belong to this module");
            }
            lesson.setOrderIndex(i);
            lessonRepository.save(lesson);
        }
    }

    @Override
    @Transactional
    public String initiateVideoUpload(UUID lessonId) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        return muxService.createDirectUploadUrl(lessonId);
    }

    @Override
    @Transactional
    public void uploadVideo(UUID lessonId, MultipartFile videoFile) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        // Validate file
        if (videoFile == null || videoFile.isEmpty()) {
            throw new BadRequestException("Video file is required");
        }

        String contentType = videoFile.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new BadRequestException("Invalid file type. Please upload a video file.");
        }

        // Upload to Mux (this handles temp file creation and cleanup)
        muxService.uploadVideoFile(lessonId, videoFile);
        log.info("Video upload initiated for lesson: {}", lesson.getTitle());
    }

    @Override
    @Transactional
    public void updateVideoStatus(String muxAssetId, String status, String playbackId, Integer duration) {
        lessonRepository.findByMuxAssetId(muxAssetId).ifPresent(lesson -> {
            lesson.setVideoStatus(status);
            if (playbackId != null) {
                lesson.setMuxPlaybackId(playbackId);
            }
            if (duration != null) {
                lesson.setVideoDurationSeconds(duration);
            }
            lessonRepository.save(lesson);
            log.info("Video status updated for lesson: {} - Status: {}", lesson.getTitle(), status);
        });
    }

    @Override
    public VideoUrlResponse getVideoUrl(UUID lessonId) {
        User         user   = getCurrentUser();
        CourseLesson lesson = findById(lessonId);
        Course       course = lesson.getModule().getCourse();

        if (!lesson.getIsPreview()) {
            if (!enrollmentService.hasAccess(user, course)) {
                throw new ForbiddenException("You don't have access to this lesson");
            }
        }

        if (!lesson.isVideoReady()) {
            throw new BadRequestException("Video is not ready yet");
        }

        // ── Local (self-hosted) video — generate signed streaming URL ──────────
        if (lesson.getVideoFilePath() != null) {
            String token     = videoTokenService.generateToken(lessonId, user.getId());
            String streamUrl = fileBaseUrl + "/api/v1/videos/" + lessonId + "/stream?token=" + token;
            return VideoUrlResponse.builder()
                    .playbackUrl(streamUrl)
                    .tokenId(token)
                    .durationSeconds(lesson.getVideoDurationSeconds())
                    .expiresAt(LocalDateTime.now().plusHours(2))
                    .build();
        }

        // ── Legacy Mux video ──────────────────────────────────────────────────
        return muxService.getSignedPlaybackUrl(lesson);
    }

    @Override
    @Transactional
    public void updateProgress(UUID lessonId, UpdateLessonProgressRequest request) {
        User user = getCurrentUser();
        CourseLesson lesson = findById(lessonId);
        Course course = lesson.getModule().getCourse();

        if (!enrollmentService.hasAccess(user, course)) {
            throw new ForbiddenException("You don't have access to this lesson");
        }

        LessonProgress progress = progressRepository.findByUserAndLesson(user, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .build());

        progress.updateProgress(request.getPositionSeconds(), request.getDurationSeconds());
        progress.setWatchCount(progress.getWatchCount() + 1);

        if (Boolean.TRUE.equals(request.getMarkComplete())) {
            requireNotQuizGated(lesson);
            progress.markComplete();
        }

        progressRepository.save(progress);

        CourseEnrollment enrollment = enrollmentFor(user, course);
        enrollmentService.updateLastAccessed(enrollment.getId(), lessonId);
        enrollmentService.updateProgress(enrollment.getId());
    }

    @Override
    @Transactional
    public void markComplete(UUID lessonId) {
        User user = getCurrentUser();
        CourseLesson lesson = findById(lessonId);
        requireNotQuizGated(lesson);
        Course course = lesson.getModule().getCourse();

        if (!enrollmentService.hasAccess(user, course)) {
            throw new ForbiddenException("You don't have access to this lesson");
        }

        LessonProgress progress = progressRepository.findByUserAndLesson(user, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .firstWatchedAt(LocalDateTime.now())
                        .build());

        progress.markComplete();
        progressRepository.save(progress);

        CourseEnrollment enrollment = enrollmentFor(user, course);
        enrollmentService.updateProgress(enrollment.getId());

        log.info("Lesson marked complete: {} by user: {}", lesson.getTitle(), user.getEmail());
    }

    @Override
    public String getResourcesJson(UUID lessonId) {
        CourseLesson lesson = findById(lessonId);
        // Same rule as the lesson itself: preview lessons are open, others need access.
        if (!lesson.getIsPreview()) {
            User user = getCurrentUser();
            if (!enrollmentService.hasAccess(user, lesson.getModule().getCourse())) {
                throw new ForbiddenException("You must be enrolled in this course to view its resources.");
            }
        }
        List<LessonResourceResponse> resources = LessonResponse.parseResources(lesson.getResourcesJson());
        resources.forEach(r -> r.setUrl(fileUrlSigner.sign(r.getUrl())));
        try {
            return objectMapper.writeValueAsString(resources);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    @Transactional
    public LessonResourceResponse uploadLessonResource(UUID lessonId, MultipartFile file, String name) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (file.getSize() > MAX_RESOURCE_SIZE) {
            throw new BadRequestException("File too large. Maximum size is 50 MB.");
        }

        String ext = FilenameUtils.getExtension(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "").toLowerCase();
        if (!ALLOWED_RESOURCE_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("File type not allowed. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, Images.");
        }

        // Store file on disk
        String storedFilename = UUID.randomUUID() + "." + ext;
        Path dir = Paths.get(uploadDir, "lesson-resources");
        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(storedFilename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Failed to store resource file: " + e.getMessage());
        }

        String relativePath = "lesson-resources/" + storedFilename;
        String displayName = (name != null && !name.isBlank()) ? name : file.getOriginalFilename();

        // Parse existing resources JSON (or start fresh)
        List<Map<String, Object>> resources = parseResourcesJson(lesson.getResourcesJson());

        // Generate a new numeric ID
        long newId = resources.stream()
                .mapToLong(r -> toLong(r.get("id")))
                .max().orElse(0L) + 1;

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id",   newId);
        entry.put("name", displayName);
        entry.put("url",  relativePath);
        entry.put("type", ext);
        entry.put("size", file.getSize());
        resources.add(entry);

        saveResourcesJson(lesson, resources);
        log.info("Resource '{}' uploaded for lesson '{}'", displayName, lesson.getTitle());

        return LessonResourceResponse.builder()
                .id(newId)
                .name(displayName)
                .url(fileUrlSigner.sign(relativePath))
                .type(ext)
                .size(file.getSize())
                .build();
    }

    @Override
    @Transactional
    public void deleteLessonResource(UUID lessonId, Long resourceId) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        List<Map<String, Object>> resources = parseResourcesJson(lesson.getResourcesJson());

        Map<String, Object> target = resources.stream()
                .filter(r -> toLong(r.get("id")) == resourceId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", resourceId));

        String url = (String) target.get("url");
        if (url != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, url)); } catch (IOException ignored) {}
        }

        resources.remove(target);
        saveResourcesJson(lesson, resources);
        log.info("Resource {} removed from lesson '{}'", resourceId, lesson.getTitle());
    }

    // ── Video management ──────────────────────────────────────────────────────

    @Override
    public void verifyInstructorCanModifyLesson(UUID lessonId, UUID userId, UserRole userRole) {
        if (userRole == UserRole.ADMIN) return;
        CourseLesson lesson = findById(lessonId);
        Course       course = lesson.getModule().getCourse();
        if (!course.getInstructor().getId().equals(userId)) {
            throw new ForbiddenException("You don't have permission to modify this lesson's video");
        }
    }

    @Override
    @Transactional
    public void registerLocalVideo(UUID lessonId, String filePath, String originalFilename,
                                   String contentType, long fileSize) {
        CourseLesson lesson = findById(lessonId);

        // Replace any existing local video record
        videoAssetRepository.findByLessonId(lessonId).ifPresent(existing -> {
            videoStorageService.deleteVideo(existing.getFilePath());
            videoAssetRepository.delete(existing);
        });

        VideoAsset asset = VideoAsset.builder()
                .lesson(lesson)
                .filePath(filePath)
                .originalFilename(originalFilename)
                .contentType(contentType)
                .fileSize(fileSize)
                .videoStatus("ready")
                .build();
        videoAssetRepository.save(asset);

        lesson.setVideoFilePath(filePath);
        lesson.setVideoStatus("ready");
        lessonRepository.save(lesson);

        log.info("Local video registered for lesson '{}': {}", lesson.getTitle(), filePath);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private List<Map<String, Object>> parseResourcesJson(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    private void saveResourcesJson(CourseLesson lesson, List<Map<String, Object>> resources) {
        try {
            lesson.setResourcesJson(objectMapper.writeValueAsString(resources));
            lessonRepository.save(lesson);
        } catch (IOException e) {
            throw new BadRequestException("Failed to serialize resources JSON");
        }
    }

    private long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return 0L; }
    }

    private void verifyInstructorAccess(Course course) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN &&
                !course.getInstructor().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have permission to modify this lesson");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
