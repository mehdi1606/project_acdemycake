package com.academy.entity;

import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "courses", indexes = {
        @Index(name = "idx_courses_slug", columnList = "slug", unique = true),
        @Index(name = "idx_courses_instructor_id", columnList = "instructor_id"),
        @Index(name = "idx_courses_category_id", columnList = "category_id"),
        @Index(name = "idx_courses_status", columnList = "status"),
        @Index(name = "idx_courses_is_beginner", columnList = "is_beginner"),
        @Index(name = "idx_courses_requires_purchase", columnList = "requires_purchase")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends BaseEntity {

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "slug", nullable = false, unique = true, length = 255)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "preview_video_url", length = 500)
    private String previewVideoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private CourseCategory category;

    @Column(name = "is_beginner", nullable = false)
    @Builder.Default
    private Boolean isBeginner = false;

    @Column(name = "requires_purchase", nullable = false)
    @Builder.Default
    private Boolean requiresPurchase = false;

    @Column(name = "price", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 20)
    @Builder.Default
    private CourseLevel level = CourseLevel.BEGINNER;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 0;

    @Column(name = "language", length = 10)
    @Builder.Default
    private String language = "fr";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CourseStatus status = CourseStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "enrolled_count")
    @Builder.Default
    private Integer enrolledCount = 0;

    @Column(name = "rating_average", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal ratingAverage = BigDecimal.ZERO;

    @Column(name = "rating_count")
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "what_you_will_learn", columnDefinition = "TEXT")
    private String whatYouWillLearn;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "target_audience", columnDefinition = "TEXT")
    private String targetAudience;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "certificate_template_path", length = 500)
    private String certificateTemplatePath;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<CourseModule> modules = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<CourseEnrollment> enrollments = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<CourseReview> reviews = new HashSet<>();

    public void incrementEnrollmentCount() {
        this.enrolledCount = (this.enrolledCount == null ? 0 : this.enrolledCount) + 1;
    }

    public void decrementEnrollmentCount() {
        this.enrolledCount = Math.max(0, (this.enrolledCount == null ? 0 : this.enrolledCount) - 1);
    }

    public void updateRating(BigDecimal newAverage, int newCount) {
        this.ratingAverage = newAverage;
        this.ratingCount = newCount;
    }
}
