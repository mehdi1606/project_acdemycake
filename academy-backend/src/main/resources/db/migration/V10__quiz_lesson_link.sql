-- V10: Link quiz to a specific lesson (one-to-one, nullable)
ALTER TABLE quizzes ADD COLUMN lesson_id UUID NULL REFERENCES course_lessons(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX uk_quiz_lesson_id ON quizzes(lesson_id) WHERE lesson_id IS NOT NULL;
