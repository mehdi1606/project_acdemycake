package com.academy.service.impl;

import com.academy.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * The numbers the badge ladder is checked against, for one or many users at once
 * (grouped queries, so the admin users list stays fast). The frontend combines them
 * with the member's join date and Elite approval to pick the badge, so the admin list
 * and the student's own pages always agree.
 *
 *  - enrolledCourses, completedLessons        → Apprentice
 *  - certificates (passed assignments)          → every level from Commis Chef
 *  - quiz average (best score per quiz)         → Sous Chef, Executive Chef
 *  - activeWeeks (weeks with learning activity) → Sous Chef
 *  - assignment marks (best / average, in %)    → Chef de Partie and up
 *  - community posts / comments, reviews        → Chef de Partie, Master Chef
 *  - masterclasses (and live ones)              → Executive Chef and up
 */
@Service
@RequiredArgsConstructor
public class BadgeStatsService {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String ENROLLED =
            "SELECT user_id, COUNT(*) FROM course_enrollments WHERE user_id IN (:ids) GROUP BY user_id";
    private static final String COMPLETED_COURSES =
            "SELECT user_id, COUNT(*) FROM course_enrollments WHERE user_id IN (:ids) AND is_completed = true GROUP BY user_id";
    private static final String LESSONS =
            "SELECT user_id, COUNT(*) FROM lesson_progress WHERE user_id IN (:ids) AND is_completed = true GROUP BY user_id";
    private static final String CERTIFICATES =
            "SELECT user_id, COUNT(*) FROM certificates WHERE user_id IN (:ids) GROUP BY user_id";
    private static final String QUIZZES = """
            SELECT t.student_id, COUNT(*), AVG(t.best)
            FROM (SELECT student_id, quiz_id, MAX(percentage) AS best
                  FROM quiz_attempts
                  WHERE status = 'SUBMITTED' AND student_id IN (:ids)
                  GROUP BY student_id, quiz_id) t
            GROUP BY t.student_id""";
    /** Best mark per assignment, as a percentage of its total mark. */
    private static final String ASSIGNMENTS = """
            SELECT t.student_id, COUNT(*), AVG(t.best), MAX(t.best)
            FROM (SELECT s.student_id, s.assignment_id, MAX(s.grade * 100.0 / a.total_mark) AS best
                  FROM assignment_submissions s JOIN assignments a ON a.id = s.assignment_id
                  WHERE s.grade IS NOT NULL AND a.total_mark > 0 AND s.student_id IN (:ids)
                  GROUP BY s.student_id, s.assignment_id) t
            GROUP BY t.student_id""";
    /** Distinct calendar weeks in which the member watched/finished a lesson, took a quiz or handed in an assignment. */
    private static final String ACTIVE_WEEKS = """
            SELECT x.uid, COUNT(DISTINCT date_trunc('week', x.ts))
            FROM (SELECT user_id AS uid, completed_at AS ts FROM lesson_progress WHERE completed_at IS NOT NULL
                  UNION ALL SELECT user_id, last_watched_at FROM lesson_progress WHERE last_watched_at IS NOT NULL
                  UNION ALL SELECT student_id, submitted_at FROM quiz_attempts WHERE submitted_at IS NOT NULL
                  UNION ALL SELECT student_id, submitted_at FROM assignment_submissions WHERE submitted_at IS NOT NULL) x
            WHERE x.uid IN (:ids)
            GROUP BY x.uid""";
    private static final String POSTS =
            "SELECT user_id, COUNT(*) FROM community_posts WHERE user_id IN (:ids) AND is_deleted = false GROUP BY user_id";
    private static final String COMMENTS =
            "SELECT user_id, COUNT(*) FROM community_comments WHERE user_id IN (:ids) AND is_deleted = false GROUP BY user_id";
    private static final String REVIEWS =
            "SELECT user_id, COUNT(*) FROM course_reviews WHERE user_id IN (:ids) GROUP BY user_id";
    /** Masterclasses bought/enrolled online or booked by the team (not cancelled); LIVE ones counted apart. */
    private static final String MASTERCLASSES = """
            SELECT x.uid, COUNT(DISTINCT x.cid), COUNT(DISTINCT x.cid) FILTER (WHERE x.fmt = 'LIVE')
            FROM (SELECT e.user_id AS uid, c.id AS cid, c.masterclass_format AS fmt
                  FROM course_enrollments e JOIN courses c ON c.id = e.course_id
                  WHERE c.course_type = 'MASTERCLASS'
                  UNION
                  SELECT b.user_id, c.id, c.masterclass_format
                  FROM masterclass_manual_bookings b JOIN courses c ON c.id = b.course_id
                  WHERE b.user_id IS NOT NULL AND b.cancelled_at IS NULL) x
            WHERE x.uid IN (:ids)
            GROUP BY x.uid""";

    /** Fill the badge fields on many responses with a handful of grouped queries. */
    @Transactional(readOnly = true)
    public void apply(Collection<UserResponse> responses) {
        List<UUID> ids = responses.stream().map(UserResponse::getId).filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) return;
        MapSqlParameterSource p = new MapSqlParameterSource("ids", ids);

        Map<UUID, Integer> enrolled = counts(ENROLLED, p);
        Map<UUID, Integer> completed = counts(COMPLETED_COURSES, p);
        Map<UUID, Integer> lessons = counts(LESSONS, p);
        Map<UUID, Integer> certificates = counts(CERTIFICATES, p);
        Map<UUID, Integer> weeks = counts(ACTIVE_WEEKS, p);
        Map<UUID, Integer> posts = counts(POSTS, p);
        Map<UUID, Integer> comments = counts(COMMENTS, p);
        Map<UUID, Integer> reviews = counts(REVIEWS, p);
        Map<UUID, Object[]> quiz = rows(QUIZZES, p);
        Map<UUID, Object[]> assignments = rows(ASSIGNMENTS, p);
        Map<UUID, Object[]> masterclasses = rows(MASTERCLASSES, p);

        for (UserResponse u : responses) {
            UUID id = u.getId();
            u.setEnrolledCourses(enrolled.getOrDefault(id, 0));
            u.setCompletedCourses(completed.getOrDefault(id, 0));
            u.setCompletedLessons(lessons.getOrDefault(id, 0));
            u.setCertificates(certificates.getOrDefault(id, 0));
            u.setActiveWeeks(weeks.getOrDefault(id, 0));
            u.setCommunityPosts(posts.getOrDefault(id, 0));
            u.setCommunityContributions(posts.getOrDefault(id, 0) + comments.getOrDefault(id, 0));
            u.setReviews(reviews.getOrDefault(id, 0));

            Object[] q = quiz.get(id);
            u.setQuizzesTaken(q == null ? 0 : num(q[1]));
            u.setAvgQuizScore(q == null || q[2] == null ? null : round(q[2]));

            Object[] a = assignments.get(id);
            u.setGradedAssignments(a == null ? 0 : num(a[1]));
            u.setAvgAssignmentScore(a == null || a[2] == null ? null : round(a[2]));
            u.setBestAssignmentScore(a == null || a[3] == null ? null : round(a[3]));

            Object[] m = masterclasses.get(id);
            u.setCompletedMasterclasses(m == null ? 0 : num(m[1]));
            u.setLiveMasterclasses(m == null ? 0 : num(m[2]));
        }
    }

    public UserResponse apply(UserResponse response) {
        apply(List.of(response));
        return response;
    }

    private Map<UUID, Integer> counts(String sql, MapSqlParameterSource p) {
        Map<UUID, Integer> out = new HashMap<>();
        jdbc.query(sql, p, rs -> { out.put(rs.getObject(1, UUID.class), rs.getInt(2)); });
        return out;
    }

    private Map<UUID, Object[]> rows(String sql, MapSqlParameterSource p) {
        Map<UUID, Object[]> out = new HashMap<>();
        jdbc.query(sql, p, rs -> {
            int n = rs.getMetaData().getColumnCount();
            Object[] row = new Object[n];
            for (int i = 0; i < n; i++) row[i] = rs.getObject(i + 1);
            out.put(rs.getObject(1, UUID.class), row);
        });
        return out;
    }

    private static int num(Object o) { return o == null ? 0 : ((Number) o).intValue(); }
    private static int round(Object o) { return (int) Math.round(((Number) o).doubleValue()); }
}
