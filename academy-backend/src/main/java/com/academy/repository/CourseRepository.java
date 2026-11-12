package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseCategory;
import com.academy.entity.User;
import com.academy.entity.enums.CourseLevel;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    Optional<Course> findBySlug(String slug);

    /**
     * Loads a course with a row-level write lock (SELECT … FOR UPDATE).
     * Used to serialise seat bookings on a LIVE masterclass so two concurrent
     * payments can never both take the last place.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdForUpdate(@Param("id") UUID id);

    boolean existsBySlug(String slug);

    List<Course> findByInstructor(User instructor);

    Page<Course> findByInstructor(User instructor, Pageable pageable);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    Page<Course> findByCategory(CourseCategory category, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.isBeginner = true")
    Page<Course> findPublishedBeginnerCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.requiresPurchase = true")
    Page<Course> findPublishedPremiumCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.enrolledCount DESC")
    Page<Course> findPopularCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.publishedAt DESC")
    Page<Course> findLatestCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.ratingAverage DESC")
    Page<Course> findTopRatedCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.tags) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchPublishedCourses(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND " +
            "(c.courseType = :courseType OR (c.courseType IS NULL AND :courseTypeStr = 'PLAN')) AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.tags) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchPublishedCoursesByType(@Param("search") String search,
                                               @Param("courseType") CourseType courseType,
                                               @Param("courseTypeStr") String courseTypeStr,
                                               Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.category = :category")
    Page<Course> findPublishedByCategory(@Param("category") CourseCategory category, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND (c.courseType = :courseType OR (c.courseType IS NULL AND :courseTypeStr = 'PLAN'))")
    Page<Course> findPublishedByCourseType(@Param("courseType") CourseType courseType, @Param("courseTypeStr") String courseTypeStr, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND (c.courseType = :courseType OR (c.courseType IS NULL AND :courseTypeStr = 'PLAN')) AND c.category = :category")
    Page<Course> findPublishedByCourseTypeAndCategory(@Param("courseType") CourseType courseType, @Param("courseTypeStr") String courseTypeStr, @Param("category") CourseCategory category, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.level = :level")
    Page<Course> findPublishedByLevel(@Param("level") CourseLevel level, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.instructor = :instructor AND c.status = 'PUBLISHED'")
    Page<Course> findPublishedByInstructor(@Param("instructor") User instructor, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.status = 'PUBLISHED'")
    long countPublishedCourses();

    @Query("SELECT COUNT(c) FROM Course c WHERE c.instructor = :instructor")
    long countByInstructor(@Param("instructor") User instructor);

    // Courses every subscriber is auto-enrolled in. Subscription-included (PLAN)
    // courses only: a paid masterclass flagged "beginner" must never be handed to
    // subscribers for free.
    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.isBeginner = true " +
           "AND (c.courseType IS NULL OR c.courseType = com.academy.entity.enums.CourseType.PLAN) " +
           "AND c.requiresPurchase = false")
    List<Course> findAllPublishedBeginnerCourses();
}
