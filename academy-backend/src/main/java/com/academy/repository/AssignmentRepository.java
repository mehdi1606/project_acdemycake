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

    @Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course = a.course AND e.isActive = true)")
    Page<Assignment> findPublishedByEnrolledStudent(@Param("student") User student, Pageable pageable);

    /** Published assignments of ONE course the student is actively enrolled in. */
    @Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' AND a.course.id = :courseId " +
           "AND EXISTS (SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course = a.course AND e.isActive = true) " +
           "ORDER BY a.dueDate ASC NULLS LAST, a.createdAt DESC")
    List<Assignment> findPublishedByEnrolledStudentAndCourse(@Param("student") User student,
                                                             @Param("courseId") UUID courseId);

    /**
     * Published assignments of a course this student has NOT yet been given a mark on.
     * The course certificate is withheld while this is above zero.
     */
    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.course = :course AND a.status = 'PUBLISHED' " +
           "AND NOT EXISTS (SELECT s FROM AssignmentSubmission s " +
           "WHERE s.assignment = a AND s.student = :student AND s.grade IS NOT NULL)")
    long countUngradedPublishedForStudent(@Param("course") Course course, @Param("student") User student);
}
