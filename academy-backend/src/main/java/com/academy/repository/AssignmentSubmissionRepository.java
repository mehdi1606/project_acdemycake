package com.academy.repository;

import com.academy.entity.Assignment;
import com.academy.entity.AssignmentSubmission;
import com.academy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {

    Optional<AssignmentSubmission> findByAssignmentAndStudent(Assignment assignment, User student);

    Page<AssignmentSubmission> findByAssignment(Assignment assignment, Pageable pageable);

    Page<AssignmentSubmission> findByStudent(User student, Pageable pageable);

    boolean existsByAssignmentAndStudent(Assignment assignment, User student);
}
