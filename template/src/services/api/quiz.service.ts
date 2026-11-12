import api from './axios.config';
import {
  Quiz,
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

  // Get all my attempts for a specific quiz (newest first)
  async getMyQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const response = await api.get<QuizAttempt[]>(`/student/quizzes/${quizId}/my-attempts`);
    return response.data ?? [];
  }
}

export const quizService = new QuizService();
export default quizService;
