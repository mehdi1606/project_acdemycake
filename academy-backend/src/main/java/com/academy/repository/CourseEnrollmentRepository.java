package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.User;
import com.academy.entity.enums.EnrollmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, UUID> {

    Optional<CourseEnrollment> findByUserAndCourse(User user, Course course);

    boolean existsByUserAndCourse(User user, Course course);

    List<CourseEnrollment> findByUser(User user);

    @EntityGraph(attributePaths = {"course", "course.instructor", "course.category"})
    Page<CourseEnrollment> findByUserAndIsActiveTrue(User user, Pageable pageable);

    Page<CourseEnrollment> findByCourse(Course course, Pageable pageable);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.user = :user AND e.isActive = true AND e.isCompleted = false ORDER BY e.lastAccessedAt DESC NULLS LAST")
    List<CourseEnrollment> findContinueWatching(@Param("user") User user, Pageable pageable);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.user = :user AND e.isCompleted = true")
    List<CourseEnrollment> findCompletedByUser(@Param("user") User user);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.enrollmentType = :type AND e.expiresAt < :date AND e.isActive = true")
    List<CourseEnrollment> findExpiredEnrollmentsByType(
            @Param("type") EnrollmentType type,
            @Param("date") LocalDateTime date
    );

    @Modifying
    @Query("UPDATE CourseEnrollment e SET e.isActive = false WHERE e.user = :user AND e.enrollmentType = 'SUBSCRIPTION'")
    void deactivateSubscriptionEnrollments(@Param("user") User user);

    @Query("SELECT COUNT(e) FROM CourseEnrollment e WHERE e.course = :course")
    long countByCourse(@Param("course") Course course);

    @Query("SELECT COUNT(DISTINCT e.user) FROM CourseEnrollment e WHERE e.course.instructor = :instructor")
    long countStudentsByInstructor(@Param("instructor") User instructor);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.course.instructor = :instructor ORDER BY e.enrolledAt DESC")
    Page<CourseEnrollment> findRecentEnrollmentsByInstructor(@Param("instructor") User instructor, Pageable pageable);

    @Query("SELECT COUNT(e) FROM CourseEnrollment e WHERE e.enrolledAt >= :since")
    long countEnrollmentsSince(@Param("since") LocalDateTime since);

    @Query(value = "SELECT u FROM User u WHERE u.id IN " +
                   "(SELECT DISTINCT e.user.id FROM CourseEnrollment e WHERE e.course.instructor = :instructor)",
           countQuery = "SELECT COUNT(u) FROM User u WHERE u.id IN " +
                        "(SELECT DISTINCT e.user.id FROM CourseEnrollment e WHERE e.course.instructor = :instructor)")
    Page<User> findDistinctStudentsByInstructor(@Param("instructor") User instructor, Pageable pageable);

    @Query(value = "SELECT u FROM User u WHERE u.id IN " +
                   "(SELECT DISTINCT e.user.id FROM CourseEnrollment e WHERE e.course.instructor = :instructor) " +
                   "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                   "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT COUNT(u) FROM User u WHERE u.id IN " +
                        "(SELECT DISTINCT e.user.id FROM CourseEnrollment e WHERE e.course.instructor = :instructor) " +
                        "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findDistinctStudentsByInstructorAndSearch(
            @Param("instructor") User instructor,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.course.instructor = :instructor AND e.user = :student")
    List<CourseEnrollment> findByInstructorAndStudent(
            @Param("instructor") User instructor,
            @Param("student") User student);
}
