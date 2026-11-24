package com.academy.repository;

import com.academy.entity.Certificate;
import com.academy.entity.Course;
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
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    boolean existsByCourse(com.academy.entity.Course course);

    Optional<Certificate> findByCertificateNumber(String certificateNumber);

    Optional<Certificate> findByUserAndCourse(User user, Course course);

    /** Tolerates old duplicate rows (returns the first one issued). */
    Optional<Certificate> findFirstByUserAndCourseOrderByIssuedAtAsc(User user, Course course);

    Page<Certificate> findByUserOrderByIssuedAtDesc(User user, Pageable pageable);

    boolean existsByUserAndCourse(User user, Course course);

    long countByUser(User user);

    /** All certificates issued for courses taught by a given instructor. */
    @Query("SELECT c FROM Certificate c WHERE c.course.instructor = :instructor ORDER BY c.issuedAt DESC")
    Page<Certificate> findByInstructor(@Param("instructor") User instructor, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.course.instructor = :instructor")
    long countByInstructor(@Param("instructor") User instructor);

    /** The certificate a student earned with a given assignment (at most one). */
    Optional<Certificate> findFirstByUserAndAssignmentOrderByIssuedAtAsc(User user, com.academy.entity.Assignment assignment);

    /**
     * True when the student holds a certificate for this course: an older per-course certificate, or one
     * earned with an assignment that is linked to this course.
     */
    @Query("SELECT COUNT(c) > 0 FROM Certificate c WHERE c.user = :user AND (c.course = :course " +
           "OR EXISTS (SELECT a FROM Assignment a JOIN a.courses lc WHERE a = c.assignment AND lc = :course))")
    boolean existsForUserAndCourse(@Param("user") User user, @Param("course") Course course);
}
