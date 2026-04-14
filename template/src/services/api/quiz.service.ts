import api from './axios.config';
import {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizResult,
  CreateQuizRequest,
  UpdateQuizRequest,
  SubmitQuizRequest,
  PaginatedResponse,
} from './types';

class QuizService {
  // ============================================
  // Instructor Quiz Management
  // ============================================

  // Get all quizzes for instructor's courses
  async getMyQuizzes(page = 0, size = 10): Promise<PaginatedResponse<Quiz>> {
    const response = await api.get<PaginatedResponse<Quiz>>('/instructor/quizzes', {
      params: { page, size },
    });
    return response.data;
  }

  // Get quizzes for a specific course
  async getCourseQuizzes(courseId: number): Promise<Quiz[]> {
    const response = await api.get<Quiz[]>(`/instructor/courses/${courseId}/quizzes`);
    return response.data;
  }

  // Get single quiz with questions
  async getQuiz(quizId: string): Promise<Quiz> {
    const response = await api.get<Quiz>(`/instructor/quizzes/${quizId}`);
    return response.data;
  }

  // Create new quiz
  async createQuiz(data: CreateQuizRequest): Promise<Quiz> {
    const response = await api.post<Quiz>('/instructor/quizzes', data);
    return response.data;
  }

  // Update quiz
  async updateQuiz(quizId: string, data: UpdateQuizRequest): Promise<Quiz> {
    const response = await api.put<Quiz>(`/instructor/quizzes/${quizId}`, data);
    return response.data;
  }

  // Delete quiz
  async deleteQuiz(quizId: string): Promise<void> {
    await api.delete(`/instructor/quizzes/${quizId}`);
  }

  // Publish quiz
  async publishQuiz(quizId: string): Promise<Quiz> {
    const response = await api.post<Quiz>(`/instructor/quizzes/${quizId}/publish`);
    return response.data;
  }

  // Unpublish quiz
  async unpublishQuiz(quizId: string): Promise<Quiz> {
    const response = await api.post<Quiz>(`/instructor/quizzes/${quizId}/unpublish`);
    return response.data;
  }

  // ============================================
  // Quiz Questions Management
  // ============================================

  // Add question to quiz
  async addQuestion(quizId: string, question: Omit<QuizQuestion, 'id'>): Promise<QuizQuestion> {
    const response = await api.post<QuizQuestion>(`/instructor/quizzes/${quizId}/questions`, question);
    return response.data;
  }

  // Update question
  async updateQuestion(questionId: number, question: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const response = await api.put<QuizQuestion>(`/instructor/questions/${questionId}`, question);
    return response.data;
  }

  // Delete question
  async deleteQuestion(questionId: number): Promise<void> {
    await api.delete(`/instructor/questions/${questionId}`);
  }

  // Reorder questions
  async reorderQuestions(quizId: string, questionIds: number[]): Promise<void> {
    await api.put(`/instructor/quizzes/${quizId}/questions/reorder`, { questionIds });
  }

  // ============================================
  // Quiz Results & Analytics (for instructors)
  // ============================================

  // Get quiz attempts/results
  async getQuizAttempts(
    quizId: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<QuizAttempt>> {
    const response = await api.get<PaginatedResponse<QuizAttempt>>(
      `/instructor/quizzes/${quizId}/attempts`,
      { params: { page, size } }
    );
    return response.data;
  }

  // Get quiz statistics
  async getQuizStats(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    averageTimeSpent: number;
    questionStats: {
      questionId: number;
      questionText: string;
      correctRate: number;
      averagePoints: number;
    }[];
  }> {
    const response = await api.get(`/instructor/quizzes/${quizId}/stats`);
    return response.data;
  }

  // ============================================
  // Student Quiz Operations
  // ============================================

  // Get the quiz linked to a lesson (instructor view) — returns null if none
  async getInstructorQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    const response = await api.get<Quiz | null>(`/instructor/quizzes/lesson/${lessonId}`);
    return response.data ?? null;
  }

  // Get the quiz linked to a lesson (student view) — returns null if none
  async getStudentQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    const response = await api.get<Quiz | null>(`/student/quizzes/lesson/${lessonId}`);
    return response.data ?? null;
  }

  // Get quiz for taking (without answers)
  async getQuizForStudent(quizId: string): Promise<Omit<Quiz, 'questions'> & {
    questions: {
      id: number;
      type: string;
      text: string;
      points: number;
      options: { id: number; text: string }[];
    }[];
  }> {
    const response = await api.get(`/student/quizzes/${quizId}`);
    return response.data;
  }

  // Start quiz attempt – returns UUID string
  async startQuizAttempt(quizId: string): Promise<{
    attemptId: string;
    startedAt: string;
    endsAt: string;
  }> {
    const response = await api.post(`/student/quizzes/${quizId}/start`);
    return response.data;
  }

  // Check a single answer and receive instant feedback
  async checkAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionIds: string[]
  ): Promise<{ correct: boolean; correctOptionIds: string[]; explanation?: string }> {
    const response = await api.post(`/student/attempts/${attemptId}/check`, {
      questionId,
      selectedOptionIds,
    });
    return response.data;
  }

  // Submit quiz (grade all answers at once)
  async submitAttempt(
    attemptId: string,
    answers: { questionId: string; selectedOptionIds: string[] }[],
    violated: boolean
  ): Promise<{ score: number; totalPoints: number; percentage: number; passed: boolean; violated: boolean }> {
    const response = await api.post(`/student/attempts/${attemptId}/submit`, {
      answers,
      violated,
    });
    return response.data;
  }

  // Submit quiz answers (legacy – kept for backward compat)
  async submitQuiz(attemptId: number, data: SubmitQuizRequest): Promise<QuizResult> {
    const response = await api.post<QuizResult>(`/student/attempts/${attemptId}/submit`, data);
    return response.data;
  }

  // Get all published quizzes available for the student (from enrolled courses)
  async getMyAvailableQuizzes(page = 0, size = 10): Promise<PaginatedResponse<Quiz>> {
    const response = await api.get<PaginatedResponse<Quiz>>('/student/quizzes', {
      params: { page, size },
    });
    return response.data;
  }

  // Get my quiz attempts for a course
  async getMyAttempts(courseId: number): Promise<QuizAttempt[]> {
    const response = await api.get<QuizAttempt[]>(`/student/courses/${courseId}/quiz-attempts`);
    return response.data;
  }

  // Get all my attempts for a specific quiz (newest first)
  async getMyQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const response = await api.get<QuizAttempt[]>(`/student/quizzes/${quizId}/my-attempts`);
    return response.data ?? [];
  }

  // Get specific attempt result
  async getAttemptResult(attemptId: number): Promise<QuizResult> {
    const response = await api.get<QuizResult>(`/student/attempts/${attemptId}/result`);
    return response.data;
  }
}

export const quizService = new QuizService();
export default quizService;
