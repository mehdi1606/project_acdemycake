# Tasks: Assignments Shared by Several Courses

- [ ] T001 `V39__shared_assignments.sql` (join table + backfill, certificate columns, unique index swap)
- [ ] T002 [P] `Assignment` courses/certificateTitle/linkedCourses; `Certificate` assignment/customTitle/displayTitle
- [ ] T003 [P] Repos: `QuizAttemptRepository.existsByQuizAndStudentAndPassedTrue`, `CertificateRepository` per-assignment + course lookup, `AssignmentRepository` list queries via courses
- [ ] T004 `AssignmentRequirementsService` + impl (`missingFor`)
- [ ] T005 `CertificateService`: `issueForAssignment`, `issuePendingForCourse`; PDF/response use `displayTitle()`
- [ ] T006 `AssignmentServiceImpl`: courseIds + title rule on create/update; unlock check on submit; grading → `issueForAssignment`; `withMySubmission` adds unlock info
- [ ] T007 `EnrollmentServiceImpl` / `CourseServiceImpl.hasMyCertificate` use the new certificate API
- [ ] T008 DTOs: `CreateAssignmentRequest`, `AssignmentResponse`, `CertificateResponse`
- [ ] T009 Frontend types + `instructor.service.ts` payload
- [ ] T010 `instructorAssignment.tsx` course checkboxes + certificate title
- [ ] T011 `studentAssignment.tsx` + `courseWatch.tsx` locked state and missing list
- [ ] T012 en/ar keys
- [ ] T013 Update/add unit tests; backend build + tests; `npm run build`; ECC review
