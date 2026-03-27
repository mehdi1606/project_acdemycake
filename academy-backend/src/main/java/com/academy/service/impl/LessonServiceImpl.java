package com.academy.service.impl;

import com.academy.dto.request.CreateLessonRequest;
import com.academy.dto.request.UpdateLessonProgressRequest;
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
import com.academy.security.UserPrincipal;
import com.academy.service.EnrollmentService;
import com.academy.service.LessonService;
import com.academy.service.ModuleService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final CourseLessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final ModuleService moduleService;
    private final UserService userService;
    private final EnrollmentService enrollmentService;
    private final MuxService muxService;

    @Override
    public CourseLesson findById(UUID id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", id));
    }

    @Override
    public LessonResponse getLessonById(UUID id) {
        CourseLesson lesson = findById(id);
        return LessonResponse.fromEntity(lesson);
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
                .textContent(request.getTextContent())
                .isPreview(request.getIsPreview() != null ? request.getIsPreview() : false)
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : maxOrder + 1)
                .isPublished(true)
                .videoStatus("pending")
                .build();

        lesson = lessonRepository.save(lesson);
        log.info("Lesson created: {} in module: {}", lesson.getTitle(), module.getTitle());

        return LessonResponse.fromEntity(lesson);
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
            lesson.setTextContent(request.getTextContent());
        }
        if (request.getIsPreview() != null) {
            lesson.setIsPreview(request.getIsPreview());
        }
        if (request.getOrderIndex() != null) {
            lesson.setOrderIndex(request.getOrderIndex());
        }

        lesson = lessonRepository.save(lesson);
        log.info("Lesson updated: {}", lesson.getTitle());

        return LessonResponse.fromEntity(lesson);
    }

    @Override
    @Transactional
    public void deleteLesson(UUID lessonId) {
        CourseLesson lesson = findById(lessonId);
        verifyInstructorAccess(lesson.getModule().getCourse());

        if (lesson.getMuxAssetId() != null) {
            muxService.deleteAsset(lesson.getMuxAssetId());
        }

        lessonRepository.delete(lesson);
        log.info("Lesson deleted: {}", lesson.getTitle());
    }

    @Override
    @Transactional
    public void reorderLessons(UUID moduleId, List<UUID> lessonIds) {
        CourseModule module = moduleService.findById(moduleId);
        verifyInstructorAccess(module.getCourse());

        for (int i = 0; i < lessonIds.size(); i++) {
            CourseLesson lesson = findById(lessonIds.get(i));
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
        User user = getCurrentUser();
        CourseLesson lesson = findById(lessonId);
        Course course = lesson.getModule().getCourse();

        if (lesson.getIsPreview()) {
            return muxService.getSignedPlaybackUrl(lesson);
        }

        if (!enrollmentService.hasAccess(user, course)) {
            throw new ForbiddenException("You don't have access to this lesson");
        }

        if (!lesson.isVideoReady()) {
            throw new BadRequestException("Video is not ready yet");
        }

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
            progress.markComplete();
        }

        progressRepository.save(progress);

        CourseEnrollment enrollment = enrollmentService.getEnrollment(user, course);
        enrollmentService.updateLastAccessed(enrollment.getId(), lessonId);
        enrollmentService.updateProgress(enrollment.getId());
    }

    @Override
    @Transactional
    public void markComplete(UUID lessonId) {
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
                        .firstWatchedAt(LocalDateTime.now())
                        .build());

        progress.markComplete();
        progressRepository.save(progress);

        CourseEnrollment enrollment = enrollmentService.getEnrollment(user, course);
        enrollmentService.updateProgress(enrollment.getId());

        log.info("Lesson marked complete: {} by user: {}", lesson.getTitle(), user.getEmail());
    }

    @Override
    public String getResourcesJson(UUID lessonId) {
        CourseLesson lesson = findById(lessonId);
        return lesson.getResourcesJson();
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
