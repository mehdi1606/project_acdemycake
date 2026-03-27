package com.academy.entity;

import com.academy.entity.enums.ContentType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_lessons", indexes = {
        @Index(name = "idx_course_lessons_module_id", columnList = "module_id"),
        @Index(name = "idx_course_lessons_order", columnList = "order_index"),
        @Index(name = "idx_course_lessons_mux_asset_id", columnList = "mux_asset_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseLesson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "mux_asset_id", length = 100)
    private String muxAssetId;

    @Column(name = "mux_playback_id", length = 100)
    private String muxPlaybackId;

    @Column(name = "mux_upload_id", length = 100)
    private String muxUploadId;

    @Column(name = "video_status", length = 20)
    @Builder.Default
    private String videoStatus = "pending";

    @Column(name = "video_duration_seconds")
    private Integer videoDurationSeconds;

    @Column(name = "video_thumbnail_url", length = 500)
    private String videoThumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    @Builder.Default
    private ContentType contentType = ContentType.VIDEO;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "resources_json", columnDefinition = "TEXT")
    private String resourcesJson;

    @Column(name = "is_preview", nullable = false)
    @Builder.Default
    private Boolean isPreview = false;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = true;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    public boolean isVideoReady() {
        return "ready".equals(videoStatus) && (muxPlaybackId != null || isLocalVideo());
    }

    public boolean isLocalVideo() {
        return muxPlaybackId != null && muxPlaybackId.startsWith("local:");
    }
}
