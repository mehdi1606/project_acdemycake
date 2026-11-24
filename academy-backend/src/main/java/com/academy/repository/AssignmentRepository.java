package com.academy.repository;

import com.academy.entity.Assignment;
import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.enums.AssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    Page<Assignment> findByInstructor(User instructor, Pageable pageable);

    Page<Assignment> findByInstructorAndStatus(User instructor, AssignmentStatus status, Pageable pageable);

    long countByInstructor(User instructor);

    /** Published assignments linked to any course the student is actively enrolled in. */
    @Query(value = "SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT lc FROM Assignment a2 JOIN a2.courses lc WHERE a2 = a AND EXISTS " +
           "(SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course = lc AND e.isActive = true))",
           countQuery = "SELECT COUNT(a) FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT lc FROM Assignment a2 JOIN a2.courses lc WHERE a2 = a AND EXISTS " +
           "(SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course = lc AND e.isActive = true))")
    Page<Assignment> findPublishedByEnrolledStudent(@Param("student") User student, Pageable pageable);

    /** Published assignments linked to ONE course the student is actively enrolled in. */
    @Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT lc FROM Assignment a2 JOIN a2.courses lc WHERE a2 = a AND lc.id = :courseId) " +
           "AND EXISTS (SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course.id = :courseId AND e.isActive = true) " +
           "ORDER BY a.dueDate ASC NULLS LAST, a.createdAt DESC")
    List<Assignment> findPublishedByEnrolledStudentAndCourse(@Param("student") User student,
                                                             @Param("courseId") UUID courseId);

    /** Published assignments linked to a course (shared assignments included). */
    @Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT lc FROM Assignment a2 JOIN a2.courses lc WHERE a2 = a AND lc = :course)")
    List<Assignment> findPublishedLinkedToCourse(@Param("course") Course course);
}
