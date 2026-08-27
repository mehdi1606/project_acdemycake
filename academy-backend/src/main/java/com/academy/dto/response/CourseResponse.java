package com.academy.dto.response;

import com.academy.entity.Course;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.MasterclassFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
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
    private CourseType courseType;
    private MasterclassFormat masterclassFormat;
    /** Seat limit for a LIVE masterclass; null = unlimited. */
    private Integer maxStudents;
    /** Populated only for LIVE masterclasses; blank when the admin has not set a number. */
    private String reservationWhatsapp;
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

    // ── Multilingual translation fields ──────────────────────────────────────
    private String titleEn;
    private String descriptionEn;
    private String titleAr;
    private String titleFr;
    private String descriptionAr;
    private String descriptionFr;

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
        // Instructor may be a soft-deleted user (hidden by @SQLRestriction) → null.
        var instr = course.getInstructor();
        InstructorSummary instructor = InstructorSummary.builder()
                .id(instr != null ? instr.getId() : null)
                .fullName(instr != null ? instr.getFullName() : "Deleted User")
                .avatarUrl(instr != null ? instr.getAvatarUrl() : null)
                .bio(instr != null ? instr.getBio() : null)
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
                .title(pickTitle(course))
                .slug(course.getSlug())
                .description(pickDescription(course))
                .shortDescription(course.getShortDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .previewVideoUrl(course.getPreviewVideoUrl())
                .instructor(instructor)
                .category(category)
                .isBeginner(course.getIsBeginner())
                .courseType(course.getCourseType())
                .masterclassFormat(course.getMasterclassFormat())
                .maxStudents(course.getMaxStudents())
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
                .titleEn(course.getTitleEn())
                .descriptionEn(course.getDescriptionEn())
                .titleAr(course.getTitleAr())
                .titleFr(course.getTitleFr())
                .descriptionAr(course.getDescriptionAr())
                .descriptionFr(course.getDescriptionFr())
                .build();
    }

    private static String currentLang() {
        Locale locale = LocaleContextHolder.getLocale();
        String lang = locale != null ? locale.getLanguage() : "en";
        return lang.startsWith("ar") ? "ar" : "en";
    }

    private static String pickTitle(Course course) {
        String lang = currentLang();
        if ("ar".equals(lang) && course.getTitleAr() != null && !course.getTitleAr().isBlank()) {
            return course.getTitleAr();
        }
        if ("en".equals(lang) && course.getTitleEn() != null && !course.getTitleEn().isBlank()) {
            return course.getTitleEn();
        }
        return course.getTitle();
    }

    private static String pickDescription(Course course) {
        String lang = currentLang();
        if ("ar".equals(lang) && course.getDescriptionAr() != null && !course.getDescriptionAr().isBlank()) {
            return course.getDescriptionAr();
        }
        if ("en".equals(lang) && course.getDescriptionEn() != null && !course.getDescriptionEn().isBlank()) {
            return course.getDescriptionEn();
        }
        return course.getDescription();
    }
}
