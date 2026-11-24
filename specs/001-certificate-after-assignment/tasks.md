# Tasks: Certificate Only After a Passed Assignment

**Input**: [plan.md](./plan.md), [spec.md](./spec.md)

## Phase 1 — Data
- [ ] T001 Add `academy-backend/src/main/resources/db/migration/V38__assignment_resubmission.sql`
- [ ] T002 [P] `entity/Assignment.java`: `PASS_PERCENTAGE`, `MAX_ATTEMPTS`, `isPassingGrade`
- [ ] T003 [P] `entity/AssignmentSubmission.java`: `attemptNumber`, `previousGrade`, `previousFeedback`, `isPassed()`, `canResubmit()`

## Phase 2 — Certificate gate (US1, US2)
- [ ] T004 `repository/AssignmentRepository.java`: `countPublishedByCourse`, `countNotPassedPublishedForStudent`
- [ ] T005 `service/CertificateService.java` + `CertificateServiceImpl.java`: `isEligible`, gate in `generateCertificate`
- [ ] T006 `EnrollmentServiceImpl.updateProgress` / `markCourseComplete`: call `isEligible` before generating
- [ ] T007 `AssignmentServiceImpl.issueCertificateAfterCommit`: use `isEligible`

## Phase 3 — Resubmission + notifications (US3)
- [ ] T008 `AssignmentServiceImpl.submitAssignment`: resubmit rules, `hasAccess`
- [ ] T009 `AssignmentServiceImpl.gradeSubmission`: pass/fail notification
- [ ] T010 [P] DTOs: `SubmissionResponse`, `AssignmentResponse` (+ `withMySubmission`), `CourseResponse.hasMyCertificate` (+ `CourseServiceImpl.getCourseBySlug`)

## Phase 4 — Frontend (US3, US4)
- [ ] T011 `services/api/types.ts` new fields
- [ ] T012 `courseWatch.tsx` certificate state + assignment rows
- [ ] T013 `studentAssignment.tsx` pass/fail + resubmit
- [ ] T014 `courseDetails.tsx` CTA
- [ ] T015 `instructorAssignment.tsx` pass/fail + attempts
- [ ] T016 `en.json` + `ar.json` keys

## Phase 5 — Verify
- [ ] T017 Unit tests `CertificateEligibilityTest`, `AssignmentResubmissionTest`
- [ ] T018 Backend build + tests in Docker; frontend `npm run build`
- [ ] T019 ECC code review of the diff; fix findings
