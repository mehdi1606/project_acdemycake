package com.academy.dto.response;

import com.academy.entity.CourseEnrollment;
import com.academy.entity.enums.EnrollmentType;
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
public class EnrollmentResponse {
    private UUID id;
    private UUID courseId;
    private String courseTitle;
    private String courseSlug;
    private String courseThumbnail;
    private String courseCategory;
    private String instructorName;
    private EnrollmentType enrollmentType;
    private BigDecimal progressPercentage;
    private Integer completedLessons;
    private Integer totalLessons;
    private UUID lastAccessedLessonId;
    private LocalDateTime lastAccessedAt;
    private Boolean isCompleted;
    private LocalDateTime completedAt;
    private LocalDateTime enrolledAt;
    private LocalDateTime expiresAt;
    private Boolean isActive;
    private UUID certificateId;

    public static EnrollmentResponse fromEntity(CourseEnrollment enrollment) {
        var course = enrollment.getCourse();

        // Count completed lessons from JSON array (format: ["uuid1","uuid2",...])
        String completedJson = enrollment.getCompletedLessonsJson();
        int completedCount = 0;
        if (completedJson != null && !completedJson.isBlank() && !completedJson.equals("[]")) {
            completedCount = (int) completedJson.chars().filter(c -> c == ',').count() + 1;
        }

        // Count total lessons from course modules
        int totalCount = 0;
        try {
            if (course.getModules() != null) {
                for (var module : course.getModules()) {
                    if (module.getLessons() != null) {
                        totalCount += module.getLessons().size();
                    }
                }
            }
        } catch (Exception ignored) {
            // Lazy loading may fail outside of a transaction; default to 0
        }

        String categoryName = course.getCategory() != null ? course.getCategory().getName() : null;
        String instructorName = course.getInstructor() != null ? course.getInstructor().getFullName() : null;

        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .courseSlug(course.getSlug())
                .courseThumbnail(course.getThumbnailUrl())
                .courseCategory(categoryName)
                .instructorName(instructorName)
                .enrollmentType(enrollment.getEnrollmentType())
                .progressPercentage(enrollment.getProgressPercentage())
                .completedLessons(completedCount)
                .totalLessons(totalCount)
                .lastAccessedLessonId(enrollment.getLastAccessedLessonId())
                .lastAccessedAt(enrollment.getLastAccessedAt())
                .isCompleted(enrollment.getIsCompleted())
                .completedAt(enrollment.getCompletedAt())
                .enrolledAt(enrollment.getEnrolledAt())
                .expiresAt(enrollment.getExpiresAt())
                .isActive(enrollment.getIsActive())
                .certificateId(enrollment.getCertificateId())
                .build();
    }
}
