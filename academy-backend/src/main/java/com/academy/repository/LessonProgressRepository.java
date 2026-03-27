package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.CourseLesson;
import com.academy.entity.LessonProgress;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, UUID> {

    Optional<LessonProgress> findByUserAndLesson(User user, CourseLesson lesson);

    List<LessonProgress> findByUser(User user);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.user = :user AND lp.lesson.module.course = :course")
    List<LessonProgress> findByUserAndCourse(@Param("user") User user, @Param("course") Course course);

    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.user = :user AND lp.lesson.module.course = :course AND lp.isCompleted = true")
    long countCompletedLessonsByUserAndCourse(@Param("user") User user, @Param("course") Course course);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.user = :user AND lp.lesson.module.course = :course AND lp.isCompleted = true")
    List<LessonProgress> findCompletedByUserAndCourse(@Param("user") User user, @Param("course") Course course);

    @Query("SELECT SUM(lp.watchedDurationSeconds) FROM LessonProgress lp WHERE lp.lesson.module.course = :course")
    Long sumWatchTimeByCourse(@Param("course") Course course);

    @Query("SELECT COUNT(DISTINCT lp.user) FROM LessonProgress lp WHERE lp.lesson = :lesson")
    long countUniqueViewersByLesson(@Param("lesson") CourseLesson lesson);
}
