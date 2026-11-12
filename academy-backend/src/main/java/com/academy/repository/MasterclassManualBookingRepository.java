package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.MasterclassManualBooking;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MasterclassManualBookingRepository extends JpaRepository<MasterclassManualBooking, UUID> {

    /** Seats taken by manually added participants (not removed). */
    long countByCourseAndCancelledAtIsNull(Course course);

    boolean existsByCourseAndUserAndCancelledAtIsNull(Course course, User user);

    @Query("SELECT b FROM MasterclassManualBooking b LEFT JOIN FETCH b.user " +
           "WHERE b.course = :course ORDER BY b.createdAt DESC")
    List<MasterclassManualBooking> findAllForCourse(@Param("course") Course course);
}
