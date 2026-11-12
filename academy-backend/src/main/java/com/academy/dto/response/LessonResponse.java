package com.academy.dto.response;

import com.academy.entity.CourseLesson;
import com.academy.entity.enums.ContentType;
import com.academy.security.FileUrlSigner;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {

    private static final ObjectMapper MAPPER = new ObjectMapper();

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
    private List<LessonResourceResponse> resources;

    /**
     * Outline only — no lesson text and no file links. Safe for public
     * listings such as the course curriculum.
     */
    public static LessonResponse fromEntity(CourseLesson lesson) {
        return outline(lesson).build();
    }

    /**
     * Full lesson including text and resource files. Only call this after the
     * viewer's access to the course has been checked; file links are passed
     * through {@code signer} so they expire.
     */
    public static LessonResponse withContent(CourseLesson lesson, FileUrlSigner signer) {
        List<LessonResourceResponse> resources = parseResources(lesson.getResourcesJson());
        resources.forEach(r -> r.setUrl(signer.sign(r.getUrl())));
        return outline(lesson)
                .textContent(signer.signReferencesIn(lesson.getTextContent()))
                .resources(resources)
                .build();
    }

    public static List<LessonResourceResponse> parseResources(String json) {
        List<LessonResourceResponse> resources = new ArrayList<>();
        if (json != null && !json.isBlank()) {
            try {
                resources = MAPPER.readValue(json, new TypeReference<List<LessonResourceResponse>>() {});
            } catch (Exception ignored) {
                // Return empty list if JSON is malformed
            }
        }
        return resources;
    }

    private static LessonResponseBuilder outline(CourseLesson lesson) {
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
                .orderIndex(lesson.getOrderIndex());
    }
}
