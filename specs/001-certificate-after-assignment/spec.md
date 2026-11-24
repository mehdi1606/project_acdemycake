# Feature Specification: Certificate Only After a Passed Assignment

**Feature Branch**: `docs/claude-onboarding` (to be merged into `feature/masterclass-booking-and-fixes`)
**Created**: 2026-11-24
**Status**: Ready for planning
**Input**: Owner decision: "certificate should not be given after a quiz, certificates are handled
only after a successful assignment" — refined through clarification questions (see Clarifications).

## Clarifications

### Session 2026-11-24

- Q: When is an assignment successful? → A: A grade of at least 70% of the assignment's total mark (70/100 passes).
- Q: Courses with no assignment? → A: They never issue a certificate.
- Q: Must lessons also be completed? → A: Yes — every lesson completed AND every published assignment passed.
- Q: Existing certificates? → A: All existing certificates are kept; the rule applies going forward.
- Q: What can a student do after a failing grade? → A: Resubmit exactly once; the instructor grades again.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Certificate is earned through the assignment (Priority: P1)

A student finishes every lesson of a course (including passing its quizzes) and submits the course
assignment. The certificate is not issued yet. When the instructor gives a mark of 70% or more and
every other published assignment of the course is also passed, the certificate is issued and the
student is notified.

**Why this priority**: This is the core business rule the owner asked for; certificates must prove
the student produced real work that an instructor approved.

**Independent Test**: In a course with one assignment, complete all lessons → no certificate.
Submit, get graded 69/100 → no certificate. (Separate student) get graded 70/100 → certificate issued.

**Acceptance Scenarios**:

1. **Given** a student completed all lessons of a course with one published assignment and has not
   submitted it, **When** the last lesson (or its quiz) is completed, **Then** no certificate is issued
   and the course player explains that the assignment must be submitted and passed.
2. **Given** the student submitted and the instructor grades 70/100, **When** all lessons are completed,
   **Then** a certificate is issued and the student receives a notification.
3. **Given** the student passed the assignment but still has lessons left, **When** the last lesson is
   completed, **Then** the certificate is issued at that moment.
4. **Given** a course with two published assignments, **When** only one is passed, **Then** no certificate.

---

### User Story 2 - Quizzes and lessons alone never give a certificate (Priority: P1)

A student finishes every lesson and passes every quiz of a course that has no published assignment.
No certificate is issued, and the course page does not promise one.

**Why this priority**: Today 110 of 142 certificates come from this path; stopping it is the main ask.

**Independent Test**: Complete every lesson and quiz of a course without assignments → no certificate,
no "certificate ready" message.

**Acceptance Scenarios**:

1. **Given** a course with no published assignment, **When** a student completes 100% of it,
   **Then** the course is marked completed but no certificate is created.
2. **Given** a student passes the final quiz, **When** that completes the course, **Then** no
   certificate is created unless the assignment rule is also met.

---

### User Story 3 - One resubmission after a failing grade (Priority: P2)

A student whose submission is graded below 70% sees the result as "Not passed" with the instructor's
feedback and may send one new version. The instructor grades it again. If the second attempt also
fails, no further submission is possible.

**Why this priority**: Without a retry, a single weak submission would permanently block the
certificate.

**Independent Test**: Grade a submission 50/100 → student sees "Not passed — you can resubmit once";
resubmit → instructor sees it as a second attempt awaiting a mark; grade 40/100 → no resubmit button.

**Acceptance Scenarios**:

1. **Given** a submission graded 50/100 on its first attempt, **When** the student opens the
   assignment, **Then** they see the mark, the feedback, "Not passed" and a resubmit action.
2. **Given** the student resubmits, **Then** the submission returns to "awaiting mark", shows as
   attempt 2 of 2, and the instructor sees the previous mark for reference.
3. **Given** attempt 2 is graded below 70%, **Then** no further resubmission is accepted.
4. **Given** a submission graded 70% or more, **Then** the student cannot resubmit.

---

### User Story 4 - Clear status for students and instructors (Priority: P2)

Students see, in the course player and the assignments page, exactly what is still needed for the
certificate (lessons left, assignment to submit, awaiting mark, not passed / resubmit). Instructors
see Passed / Not passed next to each graded submission and which attempt it is. All text is
available in English and Arabic.

**Acceptance Scenarios**:

1. **Given** a course without assignments, **Then** the course player shows no certificate promise.
2. **Given** a graded submission, **Then** the instructor grading list shows "Passed" or "Not passed".

### Edge Cases

- **Resubmission after the due date**: allowed — a failing grade reopens the assignment for its one retry.
- **Assignment unpublished or deleted after submission**: it no longer counts; if every remaining
  published assignment is passed and all lessons are done, the certificate is issued on the next
  progress or grading event.
- **Assignment added later to a completed course**: students without a certificate must pass it.
  Students who already have a certificate keep it.
- **Instructor changes a mark**: a new mark replaces the old one; a lowered mark on a student who
  already has a certificate does not remove it (no deletion of existing certificates).
- **Course with no lessons (live masterclass)**: never issues a certificate (unchanged).
- **Concurrent events** (last lesson completed while the mark is saved): at most one certificate per
  student per course (unchanged guarantee).
- **Existing data**: the 2 submissions graded 0% and other failing first attempts become eligible for
  their one resubmission.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST issue a course certificate only when (a) every lesson of the course is
  completed by the student, (b) the course has at least one published assignment, and (c) every
  published assignment of the course has a passing mark for that student.
- **FR-002**: A mark is passing when it is at least 70% of the assignment's total mark.
- **FR-003**: Completing lessons or passing quizzes MUST NOT by itself create a certificate.
- **FR-004**: The certificate check MUST be re-evaluated whenever a lesson is completed and whenever a
  submission is graded, so the certificate appears as soon as both conditions hold.
- **FR-005**: After a failing mark on the first attempt, the student MUST be able to resubmit once
  (text and/or file); the submission returns to "awaiting mark" as attempt 2.
- **FR-006**: The system MUST refuse any submission after a passing mark, and any third attempt.
- **FR-007**: The previous mark of a resubmitted assignment MUST remain visible to the instructor.
- **FR-008**: Students MUST see for each assignment: not submitted / awaiting mark / passed /
  not passed (with resubmit available or not), with mark and feedback.
- **FR-009**: The course player MUST tell the student what is still missing for the certificate, and
  MUST NOT promise a certificate for a course with no published assignment.
- **FR-010**: The instructor submissions list MUST show Passed / Not passed and the attempt number.
- **FR-011**: The student MUST be notified when a mark is given, saying whether it passed and, if not,
  whether a resubmission is possible.
- **FR-012**: Existing certificates MUST be kept unchanged.
- **FR-013**: All new user-facing text MUST exist in English and Arabic.

### Key Entities

- **Assignment**: belongs to a course; has a total mark; published or not. Pass threshold = 70% of total.
- **Assignment submission**: one per student per assignment; holds content/file, mark, feedback,
  attempt number (1 or 2) and the previous attempt's mark.
- **Certificate**: at most one per student per course; issued only under FR-001.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 new certificates are issued for courses without a published assignment after release.
- **SC-002**: 100% of certificates issued after release belong to students with all lessons completed
  and every published assignment marked at 70% or more.
- **SC-003**: A student who passes the last requirement sees the certificate available within one
  page refresh of the instructor saving the mark.
- **SC-004**: Every student with a failing first attempt can submit a second version; 0 third attempts
  are accepted.
- **SC-005**: The 142 certificates existing before release are all still present afterwards.

## Assumptions

- The threshold (70%) is fixed for all assignments; no per-assignment pass mark is needed now.
- Instructors grade both attempts; there is no automatic grading of assignments.
- The 8 published courses without assignments will get assignments added by instructors if they
  should award certificates — this is a content task, not part of this feature.
- Admin manual issuing or revoking of certificates is out of scope.
