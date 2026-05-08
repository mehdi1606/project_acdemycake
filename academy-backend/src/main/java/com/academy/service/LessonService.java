package com.academy.service;

import com.academy.dto.request.CreateLessonRequest;
import com.academy.dto.request.UpdateLessonProgressRequest;
import com.academy.dto.response.LessonResourceResponse;
import com.academy.dto.response.LessonResponse;
import com.academy.dto.response.VideoUrlResponse;
import com.academy.entity.CourseLesson;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface LessonService {

    CourseLesson findById(UUID id);

    LessonResponse getLessonById(UUID id);

    List<LessonResponse> getLessonsByModule(UUID moduleId);

    LessonResponse createLesson(UUID moduleId, CreateLessonRequest request);

    LessonResponse updateLesson(UUID lessonId, CreateLessonRequest request);

    void deleteLesson(UUID lessonId);

    void reorderLessons(UUID moduleId, List<UUID> lessonIds);

    String initiateVideoUpload(UUID lessonId);

    void uploadVideo(UUID lessonId, MultipartFile videoFile);

    void updateVideoStatus(String muxAssetId, String status, String playbackId, Integer duration);

    VideoUrlResponse getVideoUrl(UUID lessonId);

    void updateProgress(UUID lessonId, UpdateLessonProgressRequest request);

    void markComplete(UUID lessonId);

    String getResourcesJson(UUID lessonId);

    LessonResourceResponse uploadLessonResource(UUID lessonId, MultipartFile file, String name);

    void deleteLessonResource(UUID lessonId, Long resourceId);
}
