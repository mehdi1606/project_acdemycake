package com.academy.repository;

import com.academy.entity.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, UUID> {

    Optional<CourseCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByName(String name);

    @Query("SELECT c FROM CourseCategory c WHERE c.isActive = true OR c.isActive IS NULL ORDER BY c.displayOrder ASC")
    List<CourseCategory> findAllActiveOrderByDisplayOrder();

    @Query("SELECT c FROM CourseCategory c ORDER BY c.displayOrder ASC")
    List<CourseCategory> findAllOrderByDisplayOrder();

    @Query("SELECT c, COUNT(course) FROM CourseCategory c LEFT JOIN c.courses course WHERE c.isActive = true OR c.isActive IS NULL GROUP BY c ORDER BY c.displayOrder ASC")
    List<Object[]> findAllActiveWithCourseCount();
}
