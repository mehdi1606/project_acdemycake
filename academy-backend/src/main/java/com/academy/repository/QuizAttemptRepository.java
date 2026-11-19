package com.academy.repository;

import com.academy.entity.Quiz;
import com.academy.entity.QuizAttempt;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    Page<QuizAttempt> findByQuiz(Quiz quiz, Pageable pageable);

    long countByQuizAndStudent(Quiz quiz, User student);

    long countByQuizAndStudentAndStatus(Quiz quiz, User student, com.academy.entity.enums.AttemptStatus status);

    java.util.Optional<QuizAttempt> findTopByQuizAndStudentAndStatusOrderByStartedAtDesc(
            Quiz quiz, User student, com.academy.entity.enums.AttemptStatus status);

    Optional<QuizAttempt> findByIdAndStudent(UUID id, User student);

    /** Returns all attempts a student made on a quiz, newest first */
    List<QuizAttempt> findByQuizAndStudentOrderByCreatedAtDesc(Quiz quiz, User student);

    /**
     * Badge rules: per student, the number of distinct quizzes submitted and the average of
     * their BEST percentage on each quiz. Rows: [student_id, quizzes, avg_best_percentage].
     */
    @org.springframework.data.jpa.repository.Query(value = """
            SELECT t.student_id, COUNT(*), AVG(t.best)
            FROM (SELECT student_id, quiz_id, MAX(percentage) AS best
                  FROM quiz_attempts
                  WHERE status = 'SUBMITTED' AND student_id IN (:ids)
                  GROUP BY student_id, quiz_id) t
            GROUP BY t.student_id
            """, nativeQuery = true)
    List<Object[]> quizStatsByStudentIds(@org.springframework.data.repository.query.Param("ids") java.util.Collection<java.util.UUID> ids);
}
