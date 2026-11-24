# Feature Specification: Assignments Shared by Several Courses

**Created**: 2026-11-24 | **Status**: Ready for planning | **Extends**: [001](../001-certificate-after-assignment/spec.md)
**Input**: "an assignment could be in more than one course — when the instructor creates an assignment
he can choose more than one course; to do the assignment the student has to finish all courses
related to the assignment and succeed at their quizzes."

## Clarifications

### Session 2026-11-24
- Q: Certificates for a shared assignment? → A: ONE certificate per assignment. The instructor writes the
  certificate title on the assignment; it is printed instead of a course name.
- Q: Single-course assignment title? → A: The instructor's title if set, otherwise the course name.
- Q: Does the unlock rule apply to every assignment? → A: Yes — single-course assignments too.
- Q: Which quizzes must be passed? → A: Every published quiz of every linked course.
- Q: Which courses can be grouped? → A: Any of the instructor's own courses (subscription and masterclass);
  the student needs access to all of them.

## User Scenarios & Testing

### User Story 1 - Instructor links an assignment to several courses (P1)
When creating or editing an assignment the instructor ticks one or more of their courses and, optionally,
writes a certificate title (required when 2+ courses are ticked).

**Acceptance**: 1) Ticking 3 courses saves an assignment visible in all 3 courses. 2) Saving with 2+
courses and no certificate title is refused with a clear message. 3) A course of another instructor
cannot be linked. 4) Existing assignments keep their single course.

### User Story 2 - Student unlocks the assignment by finishing every linked course (P1)
The assignment shows as locked with what is missing (per course: lessons left, quizzes not passed, no
access). The submit form is available only when every linked course is fully completed and all its
published quizzes are passed.

**Acceptance**: 1) Course A done, course B 2 lessons left → locked, "Course B: 2 lessons left".
2) All lessons done, one quiz in B not passed → locked, "Course B: 1 quiz to pass". 3) All done → submit.
4) A direct API submission while locked is refused.

### User Story 3 - One certificate per passed assignment, with the instructor's title (P1)
Passing the assignment (≥ 70%, see 001) issues one certificate printed with the assignment's certificate
title (or the course name if empty and single-course). It appears on every linked course as "certificate
obtained".

**Acceptance**: 1) Shared A+B assignment passed → exactly one certificate titled as the instructor wrote.
2) Single-course assignment without custom title → certificate shows the course name. 3) Failing mark →
no certificate, one resubmission (001 rules). 4) The 142 existing certificates are unchanged.

### Edge Cases
- Lessons or quizzes added to a linked course after the student submitted: the submission stays valid;
  the certificate is still issued on a passing mark.
- A course removed from an assignment: it no longer counts for unlocking.
- Student passed an assignment before this release but had not finished the course: the certificate is
  issued when the linked courses become complete and quizzes passed.
- Course with no lessons in the group (live masterclass): counts as complete when the student has access.
- Assignment deleted: certificates already issued for it are kept.

## Requirements

- **FR-001**: An assignment MUST link to one or more courses, all owned by the assignment's instructor.
- **FR-002**: An assignment MAY have a certificate title (max 255); it is REQUIRED when 2+ courses are linked.
- **FR-003**: A student MAY submit (first attempt or resubmission) only when, for every linked course,
  they have access, every lesson is completed and every published quiz has a passed attempt.
- **FR-004**: The system MUST report to the student, per linked course, what is still missing.
- **FR-005**: A passing mark MUST issue exactly one certificate per student per assignment, titled with the
  assignment's certificate title, or the primary course name when empty.
- **FR-006**: Lessons and quizzes alone MUST NOT issue certificates (unchanged from 001); course-level
  certificates are no longer issued — certificates come only from passed assignments.
- **FR-007**: Linked course pages MUST show the certificate as obtained once issued.
- **FR-008**: Existing certificates and single-course assignments MUST keep working unchanged.
- **FR-009**: All new text in English and Arabic.

## Key Entities
- **Assignment**: one primary course (kept for compatibility) + set of linked courses; optional certificate title.
- **Certificate**: belongs to a student and (for new ones) an assignment; primary course used for the
  template design; optional custom title printed on the PDF.

## Success Criteria
- **SC-001**: 0 submissions accepted while a linked course is incomplete or a quiz is not passed.
- **SC-002**: Each passed assignment yields exactly 1 certificate per student.
- **SC-003**: 100% of certificates issued after release print the instructor's title when one is set.
- **SC-004**: All 142 pre-existing certificates still download with their original title.

## Assumptions
- The primary course (first ticked) selects the certificate design (masterclass / level template).
- The 70% pass mark and one resubmission rule from 001 apply unchanged.
