-- Certificates are now earned only through a passed assignment (grade >= 70% of the total mark).
-- A student whose first attempt is graded below the pass mark may resubmit exactly once:
-- the submission row is reused (one row per student and assignment), its attempt number goes
-- to 2 and the first attempt's mark and feedback are kept for the instructor.

ALTER TABLE assignment_submissions
    ADD COLUMN IF NOT EXISTS attempt_number    INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS previous_grade    INTEGER,
    ADD COLUMN IF NOT EXISTS previous_feedback TEXT;

ALTER TABLE assignment_submissions
    DROP CONSTRAINT IF EXISTS chk_assignment_submissions_attempt_number;
ALTER TABLE assignment_submissions
    ADD CONSTRAINT chk_assignment_submissions_attempt_number CHECK (attempt_number BETWEEN 1 AND 2);
