-- Assignments can be shared by several courses, and certificates are now issued per passed assignment.
--
-- 1. assignment_courses links an assignment to every course it belongs to. assignments.course_id is kept
--    as the "primary" course (first one chosen; it selects the certificate design). Existing assignments
--    are backfilled with their single course.
-- 2. assignments.certificate_title: the title the instructor writes, printed on the certificate.
-- 3. certificates.assignment_id / custom_title: new certificates belong to the passed assignment and carry
--    the printed title. The 142 existing certificates keep assignment_id NULL and are not modified.
-- 4. "One certificate per student and course" (V32) no longer holds — one assignment covers several
--    courses and a course may have several assignments. It is replaced by one per student and assignment.

CREATE TABLE IF NOT EXISTS assignment_courses (
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    course_id     UUID NOT NULL REFERENCES courses(id)     ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_assignment_courses_course_id ON assignment_courses (course_id);

INSERT INTO assignment_courses (assignment_id, course_id)
SELECT id, course_id FROM assignments
ON CONFLICT DO NOTHING;

ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS certificate_title VARCHAR(255);

ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_title  VARCHAR(255);

DROP INDEX IF EXISTS uq_certificates_user_course;
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_user_assignment
    ON certificates (user_id, assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_assignment_id ON certificates (assignment_id);
-- Declared on the entity but never created by an earlier migration.
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates (course_id);
