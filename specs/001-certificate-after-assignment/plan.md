# Implementation Plan: Certificate Only After a Passed Assignment

**Branch**: `docs/claude-onboarding` → merge into `feature/masterclass-booking-and-fixes` | **Date**: 2026-11-24
**Spec**: [spec.md](./spec.md)

## Summary

Move every certificate decision behind one server-side eligibility check:
all lessons completed + course has ≥1 published assignment + every published assignment passed
(grade ≥ 70% of total). Add a single resubmission after a failing mark. Show pass/fail, attempts and
"what's missing for the certificate" in the student and instructor UIs (EN + AR).

## Technical Context

**Language/Version**: Java 17 / Spring Boot 3.2.3 (backend); TypeScript + React 19 (frontend)
**Storage**: PostgreSQL 16, Flyway (next migration: V38)
**Testing**: JUnit 5 + Mockito, pure unit tests (pattern of `VideoStreamingSecurityTest`); `npm run build`
**Constraints**: no Java on the dev PC → compile/test the backend in a `maven:3.9-eclipse-temurin-17` container
**Scale**: 11 published courses, 3 assignments, 27 graded submissions, 142 certificates (kept)

## Constitution Check

| Principle | Status |
|---|---|
| I. Server is source of truth | ✅ Eligibility computed only in `CertificateServiceImpl`; UI reads flags from the API |
| II. One access check | ✅ `submitAssignment` switches from `existsByUserAndCourse` to `hasAccess` (touched code) |
| III. Migrations only | ✅ New `V38__assignment_resubmission.sql`; no edits to applied migrations |
| IV. Layered conventions | ✅ Rule in entity helper + service; DTOs only carry flags |
| V. Bilingual | ✅ All new strings in `en.json` and `ar.json` |
| VI. Production safety | ✅ Existing certificates untouched; deploy only after owner approval |

## Design

### Data (V38)
`assignment_submissions` gains:
- `attempt_number INT NOT NULL DEFAULT 1`
- `previous_grade INT NULL`, `previous_feedback TEXT NULL` (first attempt's result, kept for the instructor)

### Rule
- `Assignment.PASS_PERCENTAGE = 70`, `Assignment.MAX_ATTEMPTS = 2`,
  `Assignment.isPassingGrade(grade)` → `grade != null && grade * 100 >= 70 * totalMark`.
- `AssignmentRepository.countPublishedByCourse(course)` and
  `countNotPassedPublishedForStudent(course, student)` (published assignments without a submission
  whose `grade * 100 >= 70 * totalMark`). Replaces `countUngradedPublishedForStudent`.
- `CertificateService.isEligible(user, course)`: lessons total > 0, completed == total,
  published assignments > 0, not-passed == 0.
- `generateCertificate`: still returns an existing certificate unchanged (FR-012); otherwise throws
  `BadRequestException` unless `isEligible` — so every caller (progress, grading, the unused
  `markCourseComplete`) goes through the same gate.
- `EnrollmentServiceImpl.updateProgress` and `AssignmentServiceImpl.issueCertificateAfterCommit`
  call `isEligible` first, so ineligible courses no longer log a warning on every heartbeat.

### Resubmission (`AssignmentServiceImpl.submitAssignment`)
Existing submission →
- ungraded: refuse ("awaiting mark");
- passed: refuse ("already passed");
- failed and `attemptNumber >= 2`: refuse ("no attempts left");
- failed and attempt 1: move grade/feedback to `previous_*`, clear grade/feedback/gradedAt/gradedBy,
  replace content/file, `attemptNumber = 2`, reset `submittedAt`. Due date is not checked for the retry.

### Notifications (`gradeSubmission`)
After saving a mark, notify the student: passed / not passed (+ "you can resubmit once" or "no attempts left").
Certificate notification on issue stays as is.

### API (additive, backward compatible)
- `SubmissionResponse`: `attemptNumber`, `maxAttempts`, `passPercentage`, `passed` (null if ungraded),
  `canResubmit`, `previousGrade`, `previousFeedback`.
- `AssignmentResponse` (student views): `myPassed`, `myCanResubmit`, `myAttemptNumber`, `passPercentage`.
- `CourseResponse` (slug endpoint, user-specific): `hasMyCertificate`.

### Frontend
- `types.ts`: new optional fields.
- `courseWatch.tsx`: certificate state = `ready` (hasMyCertificate) | `pending` (has assignments, not
  all passed) | `none` (no assignments → no promise). Assignment rows show Passed / Not passed + resubmit.
- `studentAssignment.tsx`: pass/fail badge, attempt "1/2", previous mark, "Resubmit" button → form.
- `courseDetails.tsx`: CTA uses `hasMyCertificate` + assignments.
- `instructorAssignment.tsx`: Passed / Not passed chip, attempt number, previous mark.
- `en.json` / `ar.json`: new keys under `courseWatch.*`, `student.assignments.*`, `instructor.assignmentsPage.*`.

## Verification
- Unit tests `CertificateEligibilityTest` (eligibility matrix + 70% boundary) and
  `AssignmentResubmissionTest` (each refusal + the one allowed retry).
- Backend `mvnw package` (in Docker), frontend `npm run build`.
- ECC code review of the diff before offering deploy.
