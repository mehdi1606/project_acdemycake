package com.academy.repository;

import com.academy.entity.Assignment;
import com.academy.entity.User;
import com.academy.entity.enums.AssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    Page<Assignment> findByInstructor(User instructor, Pageable pageable);

    Page<Assignment> findByInstructorAndStatus(User instructor, AssignmentStatus status, Pageable pageable);

    long countByInstructor(User instructor);

    @Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " +
           "AND EXISTS (SELECT e FROM CourseEnrollment e WHERE e.user = :student AND e.course = a.course AND e.isActive = true)")
    Page<Assignment> findPublishedByEnrolledStudent(@Param("student") User student, Pageable pageable);
}
