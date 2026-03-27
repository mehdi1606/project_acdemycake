package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "course_modules", indexes = {
        @Index(name = "idx_course_modules_course_id", columnList = "course_id"),
        @Index(name = "idx_course_modules_order", columnList = "order_index")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseModule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = true;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<CourseLesson> lessons = new ArrayList<>();

    public int getTotalDurationSeconds() {
        return lessons.stream()
                .mapToInt(lesson -> lesson.getVideoDurationSeconds() != null ? lesson.getVideoDurationSeconds() : 0)
                .sum();
    }
}
