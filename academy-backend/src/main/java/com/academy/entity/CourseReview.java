package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_reviews", indexes = {
        @Index(name = "idx_course_reviews_course_id", columnList = "course_id"),
        @Index(name = "idx_course_reviews_user_id", columnList = "user_id"),
        @Index(name = "idx_course_reviews_rating", columnList = "rating")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_course_review_user_course", columnNames = {"user_id", "course_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "is_verified_purchase", nullable = false)
    @Builder.Default
    private Boolean isVerifiedPurchase = false;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "helpful_count")
    @Builder.Default
    private Integer helpfulCount = 0;
}
