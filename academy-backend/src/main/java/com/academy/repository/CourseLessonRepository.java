package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseLesson;
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
public interface CourseLessonRepository extends JpaRepository<CourseLesson, UUID> {

    List<CourseLesson> findByModuleOrderByOrderIndexAsc(CourseModule module);

    @Query("SELECT l FROM CourseLesson l WHERE l.module.course = :course ORDER BY l.module.orderIndex, l.orderIndex")
    List<CourseLesson> findByCourseOrderByOrder(@Param("course") Course course);

    @Query("SELECT MAX(l.orderIndex) FROM CourseLesson l WHERE l.module = :module")
    Optional<Integer> findMaxOrderIndexByModule(@Param("module") CourseModule module);

    Optional<CourseLesson> findByMuxAssetId(String muxAssetId);

    Optional<CourseLesson> findByMuxUploadId(String muxUploadId);

    @Modifying
    @Query("UPDATE CourseLesson l SET l.orderIndex = l.orderIndex + 1 WHERE l.module = :module AND l.orderIndex >= :fromIndex")
    void incrementOrderIndexes(@Param("module") CourseModule module, @Param("fromIndex") int fromIndex);

    @Modifying
    @Query("UPDATE CourseLesson l SET l.orderIndex = l.orderIndex - 1 WHERE l.module = :module AND l.orderIndex > :fromIndex")
    void decrementOrderIndexes(@Param("module") CourseModule module, @Param("fromIndex") int fromIndex);

    long countByModule(CourseModule module);

    @Query("SELECT COUNT(l) FROM CourseLesson l WHERE l.module.course = :course")
    long countByCourse(@Param("course") Course course);

    @Query("SELECT l FROM CourseLesson l WHERE l.module.course = :course AND l.isPreview = true")
    List<CourseLesson> findPreviewLessonsByCourse(@Param("course") Course course);
}
