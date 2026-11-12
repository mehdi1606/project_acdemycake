-- V32 — One certificate per student and course.
-- Two completion paths (quiz pass + lesson completion) could create two
-- certificates at the same moment; afterwards every lookup failed with
-- "query did not return a unique result" (HTTP 500).
--
-- The unique index is only created when the existing data has no duplicates,
-- so this migration can never block a deployment. If duplicates exist they are
-- reported in the log and the application code still tolerates them.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM certificates GROUP BY user_id, course_id HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE 'Duplicate certificates found — unique index uq_certificates_user_course NOT created. Remove duplicates, then create it manually.';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_user_course ON certificates (user_id, course_id);
    END IF;
END $$;
