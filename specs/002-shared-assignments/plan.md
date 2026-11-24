# Implementation Plan: Assignments Shared by Several Courses

**Spec**: [spec.md](./spec.md) | **Date**: 2026-11-24 | **Branch**: `feature/certificate-after-assignment`

## Constitution Check
| Principle | Status |
|---|---|
| I. Server source of truth | ✅ Unlock and certificate decided in one backend service; UI shows `myMissing` |
| II. One access check | ✅ Unlock uses `EnrollmentService.hasAccess` per linked course |
| III. Migrations only | ✅ `V39__shared_assignments.sql`, backfills links, no edits to V1–V38 |
| IV. Layered | ✅ New `AssignmentRequirementsService` (interface + impl) |
| V. Bilingual | ✅ en/ar keys |
| VI. Production safety | ✅ 142 certificates untouched; old unique index replaced, not data |

## Data (V39)
- `assignment_courses(assignment_id → assignments ON DELETE CASCADE, course_id → courses ON DELETE CASCADE,
  PK(assignment_id, course_id))`, index on `course_id`; backfilled from `assignments.course_id`.
- `assignments.certificate_title VARCHAR(255) NULL`.
- `certificates.assignment_id UUID NULL → assignments ON DELETE SET NULL`, `certificates.custom_title VARCHAR(255) NULL`.
- Drop `uq_certificates_user_course` (one per course no longer holds); add unique
  `uq_certificates_user_assignment (user_id, assignment_id) WHERE assignment_id IS NOT NULL`.

## Backend
- `Assignment`: `@ManyToMany Set<Course> courses` (join table above), `certificateTitle`,
  `linkedCourses()` (falls back to the primary `course`). `course` stays = primary (first ticked).
- `Certificate`: `assignment`, `customTitle`; `displayTitle()` = customTitle else stored/EN course title.
- `AssignmentRequirementsService.missingFor(student, assignment)` → list of
  `{courseId, courseTitle, courseSlug, noAccess, lessonsLeft, quizzesLeft}` (empty = unlocked).
  Quizzes: `QuizRepository.findByCourseAndStatus(PUBLISHED)` + `QuizAttemptRepository.existsByQuizAndStudentAndPassedTrue`.
- `AssignmentServiceImpl`: create/update take `courseIds` (fallback `courseId`), validate ownership and the
  title rule; `submitAssignment` refuses when `missingFor` is not empty; queries list assignments through
  `courses`.
- `CertificateService`: replace course-level `isEligible/generateCertificate` with
  `issueForAssignment(student, assignment)` (existing → returned; else requires passed + unlocked) and
  `issuePendingForCourse(student, course)` (legacy: passed assignments whose courses are now complete).
  Grading calls `issueForAssignment` after commit; progress completion calls `issuePendingForCourse`.
- PDF and `CertificateResponse` use `displayTitle()`.
- `CertificateRepository.existsForUserAndCourse` also matches certificates of assignments linked to the course.
- DTOs: `CreateAssignmentRequest.courseIds`, `certificateTitle`; `AssignmentResponse.courseIds`, `courses`,
  `certificateTitle`, `myUnlocked`, `myMissing`.

## Frontend
- Instructor form: checkbox list of own courses + certificate title (required for 2+); list shows course names.
- Student assignment page + course player: locked panel listing what is missing per course (links to courses);
  submit hidden while locked.
- `types.ts`, `instructor.service.ts` payload, en/ar keys.

## Verification
- Unit tests: requirements matrix (access / lessons / quizzes / multi-course), certificate per assignment
  (custom title, single course fallback, existing kept, no duplicate), submit refused while locked.
- Backend build + tests in Docker on the server's /tmp; `npm run build`; ECC code review.
