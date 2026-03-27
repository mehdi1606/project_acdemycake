package com.academy.dto.response;

import com.academy.entity.CourseLesson;
import com.academy.entity.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
    private UUID id;
    private UUID moduleId;
    private String title;
    private String description;
    private ContentType contentType;
    private Integer videoDurationSeconds;
    private String videoThumbnailUrl;
    private String videoStatus;
    private Boolean isPreview;
    private Boolean isPublished;
    private Integer orderIndex;
    private String textContent;
    private String resourcesJson;

    public static LessonResponse fromEntity(CourseLesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .moduleId(lesson.getModule().getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .contentType(lesson.getContentType())
                .videoDurationSeconds(lesson.getVideoDurationSeconds())
                .videoThumbnailUrl(lesson.getVideoThumbnailUrl())
                .videoStatus(lesson.getVideoStatus())
                .isPreview(lesson.getIsPreview())
                .isPublished(lesson.getIsPublished())
                .orderIndex(lesson.getOrderIndex())
                .textContent(lesson.getTextContent())
                .resourcesJson(lesson.getResourcesJson())
                .build();
    }
}
