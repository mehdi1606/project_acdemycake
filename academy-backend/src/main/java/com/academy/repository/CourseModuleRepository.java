package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseModuleRepository extends JpaRepository<CourseModule, UUID> {

    List<CourseModule> findByCourseOrderByOrderIndexAsc(Course course);

    @Query("SELECT MAX(m.orderIndex) FROM CourseModule m WHERE m.course = :course")
    Optional<Integer> findMaxOrderIndexByCourse(@Param("course") Course course);

    @Modifying
    @Query("UPDATE CourseModule m SET m.orderIndex = m.orderIndex + 1 WHERE m.course = :course AND m.orderIndex >= :fromIndex")
    void incrementOrderIndexes(@Param("course") Course course, @Param("fromIndex") int fromIndex);

    @Modifying
    @Query("UPDATE CourseModule m SET m.orderIndex = m.orderIndex - 1 WHERE m.course = :course AND m.orderIndex > :fromIndex")
    void decrementOrderIndexes(@Param("course") Course course, @Param("fromIndex") int fromIndex);

    long countByCourse(Course course);
}
