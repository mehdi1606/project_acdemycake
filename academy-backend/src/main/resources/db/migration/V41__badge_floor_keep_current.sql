-- Harder badge ladder: nobody goes down. Each existing student keeps, as a floor, the
-- badge they had under the previous rule (1 Apprentice for everyone, then completed
-- courses: 1 → Commis Chef, 3 → Sous Chef, 6 → Chef de Partie, 12 → Executive Chef,
-- 20 → Master Chef, 35 → Elite). New sign-ups start at 0 and must earn Apprentice.
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_floor INTEGER NOT NULL DEFAULT 0;

UPDATE users u
SET badge_floor = CASE
    WHEN c.done >= 35 THEN 7
    WHEN c.done >= 20 THEN 6
    WHEN c.done >= 12 THEN 5
    WHEN c.done >= 6  THEN 4
    WHEN c.done >= 3  THEN 3
    WHEN c.done >= 1  THEN 2
    ELSE 1
  END
FROM (
  SELECT u2.id, COUNT(e.id) FILTER (WHERE e.is_completed) AS done
  FROM users u2 LEFT JOIN course_enrollments e ON e.user_id = u2.id
  WHERE u2.role = 'STUDENT'
  GROUP BY u2.id
) c
WHERE c.id = u.id;
