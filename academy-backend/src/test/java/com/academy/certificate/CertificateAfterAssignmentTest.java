package com.academy.certificate;

import com.academy.dto.request.SubmitAssignmentRequest;
import com.academy.dto.response.AssignmentRequirementResponse;
import com.academy.dto.response.CertificateResponse;
import com.academy.dto.response.SubmissionResponse;
import com.academy.entity.Assignment;
import com.academy.entity.AssignmentSubmission;
import com.academy.entity.Certificate;
import com.academy.entity.Course;
import com.academy.entity.Quiz;
import com.academy.entity.User;
import com.academy.entity.enums.AssignmentStatus;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.QuizStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.repository.AssignmentRepository;
import com.academy.repository.AssignmentSubmissionRepository;
import com.academy.repository.CertificateRepository;
import com.academy.repository.CourseLessonRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.repository.QuizAttemptRepository;
import com.academy.repository.QuizRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.AssignmentRequirementsService;
import com.academy.service.EnrollmentService;
import com.academy.service.UserService;
import com.academy.service.impl.AssignmentRequirementsServiceImpl;
import com.academy.service.impl.AssignmentServiceImpl;
import com.academy.service.impl.CertificateServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Certificates are earned only through a passed assignment (mark >= 70%). An assignment can be
 * shared by several courses; it unlocks once every linked course is finished (all lessons +
 * every published quiz passed). One certificate per assignment, printed with the instructor's
 * certificate title. One resubmission is allowed after a failing first mark.
 */
class CertificateAfterAssignmentTest {

    private static User user(String email, UserRole role) {
        User u = User.builder().email(email).fullName(email).role(role).build();
        ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
        return u;
    }

    private static Course course(User instructor, String title) {
        Course c = Course.builder()
                .title(title).slug(title.toLowerCase().replace(' ', '-'))
                .instructor(instructor).courseType(CourseType.PLAN)
                .status(CourseStatus.PUBLISHED).requiresPurchase(false)
                .build();
        ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
        return c;
    }

    private static Assignment assignment(User instructor, int totalMark, Course... courses) {
        Assignment a = Assignment.builder()
                .course(courses.length > 0 ? courses[0] : null)
                .courses(new LinkedHashSet<>(List.of(courses)))
                .instructor(instructor).title("Bake a batch")
                .totalMark(totalMark).status(AssignmentStatus.PUBLISHED)
                .build();
        ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
        return a;
    }

    private static Quiz quiz(Course course) {
        Quiz q = Quiz.builder().course(course).title("Quiz").status(QuizStatus.PUBLISHED).build();
        ReflectionTestUtils.setField(q, "id", UUID.randomUUID());
        return q;
    }

    // ── The 70% pass mark ────────────────────────────────────────────────────

    @Nested
    @DisplayName("Pass mark: at least 70% of the total")
    class PassMark {
        private final Assignment outOf100 = assignment(null, 100);
        private final Assignment outOf20 = assignment(null, 20);

        @Test
        void seventyOutOfHundredPasses() {
            assertTrue(outOf100.isPassingGrade(70));
            assertTrue(outOf100.isPassingGrade(100));
        }

        @Test
        void belowSeventyFails() {
            assertFalse(outOf100.isPassingGrade(69));
            assertFalse(outOf100.isPassingGrade(0));
        }

        @Test
        void percentageOfOtherTotals() {
            assertTrue(outOf20.isPassingGrade(14));   // 70%
            assertFalse(outOf20.isPassingGrade(13));  // 65%
        }

        @Test
        void noMarkIsNotAPass() {
            assertFalse(outOf100.isPassingGrade(null));
        }
    }

    // ── Unlock: every linked course finished ─────────────────────────────────

    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    @DisplayName("Unlock requirements across linked courses")
    class Requirements {
        @Mock EnrollmentService enrollmentService;
        @Mock CourseLessonRepository courseLessonRepository;
        @Mock LessonProgressRepository lessonProgressRepository;
        @Mock QuizRepository quizRepository;
        @Mock QuizAttemptRepository quizAttemptRepository;
        @InjectMocks AssignmentRequirementsServiceImpl requirements;

        private final User instructor = user("chef@saralowe.ma", UserRole.INSTRUCTOR);
        private final User student = user("student@saralowe.ma", UserRole.STUDENT);
        private final Course a = course(instructor, "Macarons");
        private final Course b = course(instructor, "Choux");
        private final Assignment shared = assignment(instructor, 100, a, b);

        /** Both courses fully finished, quizzes passed — unlocked baseline. */
        @BeforeEach
        void allFinished() {
            for (Course c : List.of(a, b)) {
                when(enrollmentService.hasAccess(student, c)).thenReturn(true);
                when(courseLessonRepository.countByCourse(c)).thenReturn(4L);
                when(lessonProgressRepository.countCompletedLessonsByUserAndCourse(student, c)).thenReturn(4L);
                Quiz q = quiz(c);
                when(quizRepository.findByCourseAndStatus(c, QuizStatus.PUBLISHED)).thenReturn(List.of(q));
                when(quizAttemptRepository.hasPassed(q, student)).thenReturn(true);
            }
        }

        @Test
        @DisplayName("every course finished and every quiz passed → unlocked")
        void unlocked() {
            assertTrue(requirements.isUnlocked(student, shared));
        }

        @Test
        @DisplayName("lessons left in ONE of the courses → locked, that course reported")
        void lessonsLeftInSecondCourse() {
            when(lessonProgressRepository.countCompletedLessonsByUserAndCourse(student, b)).thenReturn(2L);
            List<AssignmentRequirementResponse> missing = requirements.missingFor(student, shared);
            assertEquals(1, missing.size());
            assertEquals(b.getId(), missing.get(0).getCourseId());
            assertEquals(2, missing.get(0).getLessonsLeft());
        }

        @Test
        @DisplayName("a published quiz not passed → locked")
        void quizNotPassed() {
            Quiz q = quiz(a);
            when(quizRepository.findByCourseAndStatus(a, QuizStatus.PUBLISHED)).thenReturn(List.of(q));
            when(quizAttemptRepository.hasPassed(q, student)).thenReturn(false);
            List<AssignmentRequirementResponse> missing = requirements.missingFor(student, shared);
            assertEquals(1, missing.size());
            assertEquals(1, missing.get(0).getQuizzesLeft());
        }

        @Test
        @DisplayName("no access to one course (e.g. masterclass not bought) → locked")
        void noAccess() {
            when(enrollmentService.hasAccess(student, b)).thenReturn(false);
            List<AssignmentRequirementResponse> missing = requirements.missingFor(student, shared);
            assertTrue(missing.get(0).isNoAccess());
        }
    }

    // ── One certificate per passed assignment ────────────────────────────────

    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    @DisplayName("Certificate per passed assignment")
    class Issuing {
        @Mock CertificateRepository certificateRepository;
        @Mock UserService userService;
        @Mock AssignmentRepository assignmentRepository;
        @Mock AssignmentSubmissionRepository assignmentSubmissionRepository;
        @Mock AssignmentRequirementsService assignmentRequirementsService;
        @InjectMocks CertificateServiceImpl certificateService;

        private final User instructor = user("chef@saralowe.ma", UserRole.INSTRUCTOR);
        private final User student = user("student@saralowe.ma", UserRole.STUDENT);
        private final Course a = course(instructor, "Macarons");
        private final Course b = course(instructor, "Choux");
        private final Assignment shared = assignment(instructor, 100, a, b);
        private AssignmentSubmission submission;

        @BeforeEach
        void passedAndUnlocked() {
            shared.setCertificateTitle("French Pastry Diploma");
            submission = AssignmentSubmission.builder().assignment(shared).student(student)
                    .content("work").grade(85).build();
            when(certificateRepository.findFirstByUserAndAssignmentOrderByIssuedAtAsc(student, shared))
                    .thenReturn(Optional.empty());
            when(assignmentSubmissionRepository.findByAssignmentAndStudent(shared, student))
                    .thenReturn(Optional.of(submission));
            when(assignmentRequirementsService.isUnlocked(student, shared)).thenReturn(true);
            when(certificateRepository.save(any(Certificate.class))).thenAnswer(inv -> {
                Certificate c = inv.getArgument(0);
                ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
                return c;
            });
        }

        @Test
        @DisplayName("shared assignment passed → ONE certificate with the instructor's title")
        void oneCertificateWithCustomTitle() {
            CertificateResponse r = certificateService.issueForAssignment(student, shared);
            assertEquals("French Pastry Diploma", r.getCourseTitle());

            ArgumentCaptor<Certificate> saved = ArgumentCaptor.forClass(Certificate.class);
            verify(certificateRepository, times(1)).save(saved.capture());
            assertSame(shared, saved.getValue().getAssignment());
            assertSame(a, saved.getValue().getCourse());   // primary course → certificate design
        }

        @Test
        @DisplayName("single-course assignment without a title → certificate shows the course name")
        void courseNameFallback() {
            Assignment single = assignment(instructor, 100, a);
            AssignmentSubmission s = AssignmentSubmission.builder().assignment(single).student(student)
                    .content("work").grade(90).build();
            when(certificateRepository.findFirstByUserAndAssignmentOrderByIssuedAtAsc(student, single))
                    .thenReturn(Optional.empty());
            when(assignmentSubmissionRepository.findByAssignmentAndStudent(single, student)).thenReturn(Optional.of(s));
            when(assignmentRequirementsService.isUnlocked(student, single)).thenReturn(true);

            assertEquals("Macarons", certificateService.issueForAssignment(student, single).getCourseTitle());
        }

        @Test
        @DisplayName("mark below 70% → no certificate")
        void notPassed() {
            submission.setGrade(60);
            assertThrows(BadRequestException.class, () -> certificateService.issueForAssignment(student, shared));
            verify(certificateRepository, never()).save(any());
        }

        @Test
        @DisplayName("linked courses not all finished → no certificate yet")
        void locked() {
            when(assignmentRequirementsService.isUnlocked(student, shared)).thenReturn(false);
            assertThrows(BadRequestException.class, () -> certificateService.issueForAssignment(student, shared));
            verify(certificateRepository, never()).save(any());
        }

        @Test
        @DisplayName("already issued → the same certificate, no duplicate")
        void noDuplicate() {
            Certificate existing = Certificate.builder().user(student).course(a).assignment(shared)
                    .certificateNumber("CDA-000001-ABCDEF12").studentName("s").courseTitle("x")
                    .customTitle("French Pastry Diploma").build();
            ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
            when(certificateRepository.findFirstByUserAndAssignmentOrderByIssuedAtAsc(student, shared))
                    .thenReturn(Optional.of(existing));

            assertEquals("CDA-000001-ABCDEF12",
                    certificateService.issueForAssignment(student, shared).getCertificateNumber());
            verify(certificateRepository, never()).save(any());
        }

        @Test
        @DisplayName("finishing the last course later issues the certificate of a passed assignment")
        void pendingIssuedOnCompletion() {
            when(assignmentRepository.findPublishedLinkedToCourse(b)).thenReturn(List.of(shared));
            assertEquals(1, certificateService.issuePendingForCourse(student, b).size());
        }

        @Test
        @DisplayName("finishing a course whose assignment is not passed → nothing issued")
        void pendingNotPassed() {
            submission.setGrade(null);
            when(assignmentRepository.findPublishedLinkedToCourse(b)).thenReturn(List.of(shared));
            assertTrue(certificateService.issuePendingForCourse(student, b).isEmpty());
            verify(certificateRepository, never()).save(any());
        }
    }

    // ── Submitting: locked until the courses are finished; one resubmission ──

    @Nested
    @ExtendWith(MockitoExtension.class)
    @MockitoSettings(strictness = Strictness.LENIENT)
    @DisplayName("Submission and resubmission")
    class Submitting {
        @Mock AssignmentRepository assignmentRepository;
        @Mock AssignmentSubmissionRepository assignmentSubmissionRepository;
        @Mock UserService userService;
        @Mock EnrollmentService enrollmentService;
        @Mock AssignmentRequirementsService assignmentRequirementsService;
        @Mock com.academy.security.FileUrlSigner fileUrlSigner;
        @InjectMocks AssignmentServiceImpl assignmentService;

        private final User instructor = user("chef@saralowe.ma", UserRole.INSTRUCTOR);
        private final User student = user("student@saralowe.ma", UserRole.STUDENT);
        private final Course course = course(instructor, "Macarons");
        private final Assignment assignment = assignment(instructor, 100, course);

        private AssignmentSubmission submission;

        @BeforeEach
        void setUp() {
            UserPrincipal principal = UserPrincipal.create(student);
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
            when(userService.findById(student.getId())).thenReturn(student);
            when(assignmentRepository.findById(assignment.getId())).thenReturn(Optional.of(assignment));
            when(assignmentRequirementsService.missingFor(student, assignment)).thenReturn(List.of());
            when(assignmentSubmissionRepository.save(any(AssignmentSubmission.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            submission = AssignmentSubmission.builder()
                    .assignment(assignment).student(student).content("first try").build();
            ReflectionTestUtils.setField(submission, "id", UUID.randomUUID());
        }

        @AfterEach
        void clearSecurity() {
            SecurityContextHolder.clearContext();
        }

        private SubmissionResponse submit(String content) {
            SubmitAssignmentRequest req = new SubmitAssignmentRequest();
            req.setContent(content);
            return assignmentService.submitAssignment(assignment.getId(), req);
        }

        private void existing(Integer grade, int attempt) {
            submission.setGrade(grade);
            submission.setFeedback(grade != null ? "feedback " + grade : null);
            submission.setAttemptNumber(attempt);
            when(assignmentSubmissionRepository.findByAssignmentAndStudent(assignment, student))
                    .thenReturn(Optional.of(submission));
        }

        @Test
        @DisplayName("courses not finished → submission refused")
        void lockedRefused() {
            when(assignmentRequirementsService.missingFor(student, assignment)).thenReturn(List.of(
                    AssignmentRequirementResponse.builder().courseId(course.getId()).courseTitle("Macarons")
                            .lessonsLeft(3).build()));
            assertThrows(BadRequestException.class, () -> submit("work"));
            verify(assignmentSubmissionRepository, never()).save(any());
        }

        @Test
        @DisplayName("no access to any linked course → refused as forbidden")
        void noAccess() {
            when(assignmentRequirementsService.missingFor(student, assignment)).thenReturn(List.of(
                    AssignmentRequirementResponse.builder().courseId(course.getId()).noAccess(true).build()));
            assertThrows(ForbiddenException.class, () -> submit("work"));
        }

        @Test
        @DisplayName("failing first mark → one resubmission, previous mark kept, awaiting a new mark")
        void resubmitAfterFail() {
            existing(50, 1);
            SubmissionResponse r = submit("second try");

            assertEquals(2, r.getAttemptNumber());
            assertNull(r.getGrade());
            assertNull(r.getPassed());
            assertEquals(50, r.getPreviousGrade());
            assertEquals("feedback 50", r.getPreviousFeedback());
            assertEquals("second try", r.getContent());
            assertFalse(r.getCanResubmit());
        }

        @Test
        @DisplayName("resubmission is allowed even after the due date")
        void resubmitAfterDueDate() {
            assignment.setDueDate(LocalDate.now().minusDays(10));
            existing(40, 1);
            assertEquals(2, submit("late retry").getAttemptNumber());
        }

        @Test
        @DisplayName("second attempt failed → no third attempt")
        void noThirdAttempt() {
            existing(40, 2);
            assertThrows(BadRequestException.class, () -> submit("third try"));
            verify(assignmentSubmissionRepository, never()).save(any());
        }

        @Test
        @DisplayName("passed (70/100) → cannot resubmit")
        void passedIsFinal() {
            existing(70, 1);
            assertThrows(BadRequestException.class, () -> submit("again"));
        }

        @Test
        @DisplayName("waiting for a mark → cannot resubmit")
        void awaitingMark() {
            existing(null, 1);
            assertThrows(BadRequestException.class, () -> submit("again"));
        }
    }
}
