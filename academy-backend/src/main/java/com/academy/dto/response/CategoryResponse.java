package com.academy.dto.response;

import com.academy.entity.CourseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private Integer coursesCount;

    private String nameEn;
    private String nameAr;
    private String descriptionEn;
    private String descriptionAr;

    public static CategoryResponse fromEntity(CourseCategory category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(pickName(category))
                .slug(category.getSlug())
                .description(pickDescription(category))
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .coursesCount(0)
                .nameEn(category.getNameEn())
                .nameAr(category.getNameAr())
                .descriptionEn(category.getDescriptionEn())
                .descriptionAr(category.getDescriptionAr())
                .build();
    }

    public static CategoryResponse fromEntityWithCount(CourseCategory category, int coursesCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(pickName(category))
                .slug(category.getSlug())
                .description(pickDescription(category))
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .coursesCount(coursesCount)
                .nameEn(category.getNameEn())
                .nameAr(category.getNameAr())
                .descriptionEn(category.getDescriptionEn())
                .descriptionAr(category.getDescriptionAr())
                .build();
    }

    private static String currentLang() {
        Locale locale = LocaleContextHolder.getLocale();
        String lang = locale != null ? locale.getLanguage() : "en";
        return lang.startsWith("ar") ? "ar" : "en";
    }

    private static String pickName(CourseCategory category) {
        String lang = currentLang();
        if ("ar".equals(lang) && category.getNameAr() != null && !category.getNameAr().isBlank()) {
            return category.getNameAr();
        }
        if ("en".equals(lang) && category.getNameEn() != null && !category.getNameEn().isBlank()) {
            return category.getNameEn();
        }
        return category.getName();
    }

    private static String pickDescription(CourseCategory category) {
        String lang = currentLang();
        if ("ar".equals(lang) && category.getDescriptionAr() != null && !category.getDescriptionAr().isBlank()) {
            return category.getDescriptionAr();
        }
        if ("en".equals(lang) && category.getDescriptionEn() != null && !category.getDescriptionEn().isBlank()) {
            return category.getDescriptionEn();
        }
        return category.getDescription();
    }
}
