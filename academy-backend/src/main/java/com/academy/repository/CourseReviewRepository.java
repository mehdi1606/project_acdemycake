package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseReview;
import com.academy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseReviewRepository extends JpaRepository<CourseReview, UUID> {

    Optional<CourseReview> findByUserAndCourse(User user, Course course);

    boolean existsByUserAndCourse(User user, Course course);

    Page<CourseReview> findByCourseAndIsVisibleTrueOrderByCreatedAtDesc(Course course, Pageable pageable);

    Page<CourseReview> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM CourseReview r WHERE r.course = :course AND r.isVisible = true")
    Double calculateAverageRatingByCourse(@Param("course") Course course);

    @Query("SELECT COUNT(r) FROM CourseReview r WHERE r.course = :course AND r.isVisible = true")
    long countByCourseAndIsVisibleTrue(@Param("course") Course course);

    @Query("SELECT r.rating, COUNT(r) FROM CourseReview r WHERE r.course = :course AND r.isVisible = true GROUP BY r.rating")
    Object[][] getRatingDistributionByCourse(@Param("course") Course course);
}
