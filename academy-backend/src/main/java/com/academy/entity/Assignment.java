package com.academy.entity;

import com.academy.entity.enums.AssignmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "assignments", indexes = {
        @Index(name = "idx_assignments_course_id", columnList = "course_id"),
        @Index(name = "idx_assignments_instructor_id", columnList = "instructor_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment extends BaseEntity {

    /** A mark of at least this percentage of {@link #totalMark} passes the assignment. */
    public static final int PASS_PERCENTAGE = 70;

    /** First attempt + one resubmission after a failing mark. */
    public static final int MAX_ATTEMPTS = 2;

    /** Primary course (the first one chosen). It selects the certificate design. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /**
     * Every course this assignment belongs to (includes the primary course). The student must
     * finish all of them — every lesson and every published quiz — before submitting.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "assignment_courses",
            joinColumns = @JoinColumn(name = "assignment_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id"))
    @Builder.Default
    private java.util.Set<Course> courses = new java.util.LinkedHashSet<>();

    /** Printed on the certificate; required when the assignment has several courses. */
    @Column(name = "certificate_title", length = 255)
    private String certificateTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    // Arabic version. The plain fields above hold the English (default) text.
    @Column(name = "title_ar", length = 255)
    private String titleAr;

    @Column(name = "description_ar", columnDefinition = "TEXT")
    private String descriptionAr;

    @Column(name = "instructions_ar", columnDefinition = "TEXT")
    private String instructionsAr;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "total_mark", nullable = false)
    @Builder.Default
    private Integer totalMark = 100;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.DRAFT;

    /** The linked courses, primary first; falls back to the primary course for unlinked rows. */
    public java.util.List<Course> linkedCourses() {
        java.util.List<Course> list = new java.util.ArrayList<>();
        if (course != null) list.add(course);
        if (courses != null) {
            for (Course c : courses) {
                if (course == null || !c.getId().equals(course.getId())) list.add(c);
            }
        }
        return list;
    }

    /** The title printed on the certificate: the instructor's title, else the primary course name. */
    public String certificateDisplayTitle() {
        if (certificateTitle != null && !certificateTitle.isBlank()) return certificateTitle.trim();
        if (course == null) return title;
        return course.getTitleEn() != null && !course.getTitleEn().isBlank() ? course.getTitleEn() : course.getTitle();
    }

    /** True when {@code grade} is at least {@link #PASS_PERCENTAGE}% of the total mark (70/100 passes). */
    public boolean isPassingGrade(Integer grade) {
        if (grade == null) return false;
        int total = totalMark != null && totalMark > 0 ? totalMark : 100;
        return grade * 100 >= PASS_PERCENTAGE * total;
    }
}
