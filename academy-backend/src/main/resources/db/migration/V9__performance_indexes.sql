-- Performance indexes for high-traffic query paths

-- Courses: most-filtered columns
CREATE INDEX IF NOT EXISTS idx_courses_status
    ON courses (status);

CREATE INDEX IF NOT EXISTS idx_courses_status_created
    ON courses (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_status
    ON courses (instructor_id, status);

CREATE INDEX IF NOT EXISTS idx_courses_category_status
    ON courses (category_id, status);

CREATE INDEX IF NOT EXISTS idx_courses_slug
    ON courses (slug);

-- Users: role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
    ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

-- Course enrollments: student-course lookups (very frequent)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_active
    ON course_enrollments (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_enrollments_course
    ON course_enrollments (course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_course
    ON course_enrollments (user_id, course_id);

-- Subscriptions: status lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
    ON subscriptions (user_id, status);

-- Payments: user transaction history
CREATE INDEX IF NOT EXISTS idx_payments_user_created
    ON payment_transactions (user_id, created_at DESC);

-- Assignment submissions: assignment + student lookup
CREATE INDEX IF NOT EXISTS idx_submissions_assignment
    ON assignment_submissions (assignment_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student
    ON assignment_submissions (student_id);

-- Assignments: course + status
CREATE INDEX IF NOT EXISTS idx_assignments_course_status
    ON assignments (course_id, status);
