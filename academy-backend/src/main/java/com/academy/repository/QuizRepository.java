package com.academy.repository;

import com.academy.entity.Course;
import com.academy.entity.Quiz;
import com.academy.entity.User;
import com.academy.entity.enums.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    Page<Quiz> findByInstructor(User instructor, Pageable pageable);

    Page<Quiz> findByInstructorAndStatus(User instructor, QuizStatus status, Pageable pageable);

    List<Quiz> findByCourseAndStatus(Course course, QuizStatus status);

    List<Quiz> findByCourse(Course course);

    long countByInstructor(User instructor);

    Page<Quiz> findByCourseInAndStatus(List<Course> courses, QuizStatus status, Pageable pageable);
}
