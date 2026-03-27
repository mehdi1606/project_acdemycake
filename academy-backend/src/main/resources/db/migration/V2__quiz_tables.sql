-- ============================================================
-- V2: Quiz tables + initial admin user
-- ============================================================

-- Enable pgcrypto for password hashing and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 70,
    duration INTEGER NOT NULL DEFAULT 30,
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    show_correct_answers BOOLEAN NOT NULL DEFAULT TRUE,
    allow_retake BOOLEAN NOT NULL DEFAULT TRUE,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_instructor_id ON quizzes(instructor_id);

-- Quiz questions table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    text TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(order_index);

-- Quiz options (answer choices) table
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);

-- ============================================================
-- Initial admin user
-- Email: anouareloddy@gmail.com  |  Password: Admin@1234
-- ============================================================
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    is_email_verified,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'anouareloddy@gmail.com',
    crypt('Admin@1234', gen_salt('bf', 10)),
    'Anouar El Oddy',
    'ADMIN',
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'anouareloddy@gmail.com'
);
