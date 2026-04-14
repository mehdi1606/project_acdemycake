package com.academy.dto.response;

import com.academy.entity.Course;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private UUID id;
    private String title;
    private String slug;
    private String description;
    private String shortDescription;
    private String thumbnailUrl;
    private String previewVideoUrl;
    private InstructorSummary instructor;
    private CategoryResponse category;
    private Boolean isBeginner;
    private Boolean requiresPurchase;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String currency;
    private CourseLevel level;
    private Integer durationMinutes;
    private String language;
    private CourseStatus status;
    private LocalDateTime publishedAt;
    private Integer enrolledCount;
    private BigDecimal ratingAverage;
    private Integer ratingCount;
    private String whatYouWillLearn;
    private String requirements;
    private String targetAudience;
    private String tags;
    private Integer modulesCount;
    private Integer lessonsCount;
    private LocalDateTime createdAt;
    private Boolean hasCertificateTemplate;

    // ── Authenticated-user fields (set at request time, never cached) ──────────
    private Boolean isEnrolled;
    private Integer enrollmentProgress; // 0–100

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorSummary {
        private UUID id;
        private String fullName;
        private String avatarUrl;
        private String bio;
    }

    public static CourseResponse fromEntity(Course course) {
        InstructorSummary instructor = InstructorSummary.builder()
                .id(course.getInstructor().getId())
                .fullName(course.getInstructor().getFullName())
                .avatarUrl(course.getInstructor().getAvatarUrl())
                .bio(course.getInstructor().getBio())
                .build();

        CategoryResponse category = null;
        if (course.getCategory() != null) {
            category = CategoryResponse.fromEntity(course.getCategory());
        }

        int modulesCount = course.getModules() != null ? course.getModules().size() : 0;
        int lessonsCount = course.getModules() != null ?
                course.getModules().stream()
                        .mapToInt(m -> m.getLessons() != null ? m.getLessons().size() : 0)
                        .sum() : 0;

        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .shortDescription(course.getShortDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .previewVideoUrl(course.getPreviewVideoUrl())
                .instructor(instructor)
                .category(category)
                .isBeginner(course.getIsBeginner())
                .requiresPurchase(course.getRequiresPurchase())
                .price(course.getPrice())
                .originalPrice(course.getOriginalPrice())
                .currency(course.getCurrency())
                .level(course.getLevel())
                .durationMinutes(course.getDurationMinutes())
                .language(course.getLanguage())
                .status(course.getStatus())
                .publishedAt(course.getPublishedAt())
                .enrolledCount(course.getEnrolledCount())
                .ratingAverage(course.getRatingAverage())
                .ratingCount(course.getRatingCount())
                .whatYouWillLearn(course.getWhatYouWillLearn())
                .requirements(course.getRequirements())
                .targetAudience(course.getTargetAudience())
                .tags(course.getTags())
                .modulesCount(modulesCount)
                .lessonsCount(lessonsCount)
                .createdAt(course.getCreatedAt())
                .hasCertificateTemplate(course.getCertificateTemplatePath() != null
                        && !course.getCertificateTemplatePath().isBlank())
                .build();
    }
}
