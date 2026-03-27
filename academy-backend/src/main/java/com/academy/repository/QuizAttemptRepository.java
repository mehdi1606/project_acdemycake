package com.academy.repository;

import com.academy.entity.Quiz;
import com.academy.entity.QuizAttempt;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    Page<QuizAttempt> findByQuiz(Quiz quiz, Pageable pageable);

    long countByQuizAndStudent(Quiz quiz, User student);

    Optional<QuizAttempt> findByIdAndStudent(UUID id, User student);
}
