import api, { apiMultipart } from './axios.config';
import {
  Course,
  CourseModule,
  CourseLesson,
  InstructorDashboard,
  InstructorEarning,
  EarningsSummary,
  Payout,
  PayoutRequest,
  PaginatedResponse,
  CourseLevel,
} from './types';

interface CreateCourseRequest {
  title: string;
  shortDescription?: string;
  description: string;
  categoryId?: string; // UUID string
  level?: CourseLevel;
  language?: string;
  price?: number;
  originalPrice?: number;
  requiresPurchase?: boolean;
  isBeginner?: boolean;
  requirements?: string;
  whatYouWillLearn?: string;
  targetAudience?: string;
  tags?: string;
}

interface UpdateCourseRequest extends Partial<CreateCourseRequest> {}

interface CreateModuleRequest {
  title: string;
  description?: string;
  orderIndex: number;
}

interface CreateLessonRequest {
  title: string;
  description?: string;
  orderIndex: number;
  isFreePreview: boolean;
  contentType: 'VIDEO' | 'TEXT' | 'QUIZ';
  textContent?: string;
}

interface StudentInfo {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  enrolledAt: string;
  progress: number;
}

export interface InstructorStudentInfo {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  enrolledCoursesCount: number;
  averageProgress: number;
  firstEnrolledAt: string;
  lastAccessedAt?: string;
}

interface StudentsPageResponse {
  content: InstructorStudentInfo[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface StudentCourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  instructorName: string;
  progressPercentage: number;
  isCompleted: boolean;
  enrolledAt: string;
  lastAccessedAt?: string;
}

export interface InstructorStudentDetail {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  enrolledCoursesCount: number;
  averageProgress: number;
  firstEnrolledAt?: string;
  lastAccessedAt?: string;
  enrolledCourses: StudentCourseEnrollment[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postType: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

interface AnnouncementsPageResponse {
  content: Announcement[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED';

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  totalMark: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt?: string;
}

interface AssignmentsPageResponse {
  content: Assignment[];
  page: number;
  totalPages: number;
  totalElements: number;
}

interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  totalMark?: number;
  status?: AssignmentStatus;
}

class InstructorService {
  // ============================================
  // Dashboard
  // ============================================

  async getDashboard(): Promise<InstructorDashboard> {
    const response = await api.get<InstructorDashboard>('/instructor/dashboard');
    return response.data;
  }

  // ============================================
  // Course Management
  // ============================================

  // Get instructor's courses
  async getMyCourses(page = 0, size = 10): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/instructor/courses', {
      params: { page, size },
    });
    return response.data;
  }

  // Create new course
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    const response = await api.post<Course>('/instructor/courses', data);
    return response.data;
  }

  // Update course
  async updateCourse(courseId: string, data: UpdateCourseRequest): Promise<Course> {
    const response = await api.put<Course>(`/instructor/courses/${courseId}`, data);
    return response.data;
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/instructor/courses/${courseId}`);
  }

  // Submit course for review
  async submitForReview(courseId: string): Promise<Course> {
    const response = await api.post<Course>(`/instructor/courses/${courseId}/publish`);
    return response.data;
  }

  // Upload course thumbnail
  async uploadThumbnail(courseId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiMultipart.post<string>(`/instructor/courses/${courseId}/thumbnail`, formData);
    return response.data;
  }

  // ============================================
  // Module Management
  // ============================================

  // Get course modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const response = await api.get<CourseModule[]>(`/instructor/courses/${courseId}/modules`);
    return response.data;
  }

  // Create module
  async createModule(courseId: string, data: CreateModuleRequest): Promise<CourseModule> {
    const response = await api.post<CourseModule>(`/instructor/courses/${courseId}/modules`, data);
    return response.data;
  }

  // Update module
  async updateModule(moduleId: string, data: Partial<CreateModuleRequest>): Promise<CourseModule> {
    const response = await api.put<CourseModule>(`/instructor/modules/${moduleId}`, data);
    return response.data;
  }

  // Delete module
  async deleteModule(moduleId: string): Promise<void> {
    await api.delete(`/instructor/modules/${moduleId}`);
  }

  // ============================================
  // Lesson Management
  // ============================================

  // Create lesson
  async createLesson(moduleId: string, data: CreateLessonRequest): Promise<CourseLesson> {
    const response = await api.post<CourseLesson>(`/instructor/modules/${moduleId}/lessons`, data);
    return response.data;
  }

  // Update lesson
  async updateLesson(lessonId: string, data: Partial<CreateLessonRequest>): Promise<CourseLesson> {
    const response = await api.put<CourseLesson>(`/instructor/lessons/${lessonId}`, data);
    return response.data;
  }

  // Delete lesson
  async deleteLesson(lessonId: string): Promise<void> {
    await api.delete(`/instructor/lessons/${lessonId}`);
  }

  // Get video upload URL (MUX direct upload)
  async getVideoUploadUrl(lessonId: string): Promise<{ uploadUrl: string; uploadId: string }> {
    const response = await api.post<{ uploadUrl: string; uploadId: string }>(`/instructor/lessons/${lessonId}/upload-video`);
    return response.data;
  }

  // Upload video file (server-side upload to Mux)
  async uploadVideo(lessonId: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await apiMultipart.post(`/instructor/lessons/${lessonId}/video`, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  }

  // ============================================
  // Students
  // ============================================

  // Get instructor's students (paginated with optional search)
  async getMyStudents(
    page = 0,
    size = 10,
    search?: string
  ): Promise<StudentsPageResponse> {
    const params: Record<string, unknown> = { page, size };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await api.get<StudentsPageResponse>('/instructor/students', { params });
    return response.data;
  }

  // Get detailed profile of a specific student
  async getStudentDetail(studentId: string): Promise<InstructorStudentDetail> {
    const response = await api.get<InstructorStudentDetail>(`/instructor/students/${studentId}`);
    return response.data;
  }

  // Get course students
  async getCourseStudents(
    courseId: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<StudentInfo>> {
    const response = await api.get<PaginatedResponse<StudentInfo>>(`/instructor/courses/${courseId}/students`, {
      params: { page, size },
    });
    return response.data;
  }

  // ============================================
  // Announcements
  // ============================================

  async getMyAnnouncements(page = 0, size = 20): Promise<AnnouncementsPageResponse> {
    const response = await api.get<AnnouncementsPageResponse>('/instructor/announcements', {
      params: { page, size },
    });
    return response.data;
  }

  async createAnnouncement(title: string, content: string): Promise<Announcement> {
    const response = await api.post<Announcement>('/instructor/announcements', {
      title,
      content,
      postType: 'ANNOUNCEMENT',
    });
    return response.data;
  }

  async updateAnnouncement(id: string, title: string, content: string): Promise<Announcement> {
    const response = await api.put<Announcement>(`/instructor/announcements/${id}`, {
      title,
      content,
    });
    return response.data;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await api.delete(`/instructor/announcements/${id}`);
  }

  // ============================================
  // Earnings & Payouts
  // ============================================

  /** Summary cards + last-12-months chart breakdown */
  async getEarningsSummary(): Promise<EarningsSummary> {
    const response = await api.get<EarningsSummary>('/instructor/earnings/summary');
    return response.data;
  }

  /** Paginated raw earnings list */
  async getEarnings(page = 0, size = 20): Promise<PaginatedResponse<InstructorEarning>> {
    const response = await api.get<PaginatedResponse<InstructorEarning>>('/instructor/earnings', {
      params: { page, size },
    });
    return response.data;
  }

  /** Paginated statements (same as earnings, with courseName resolved) */
  async getStatements(page = 0, size = 10): Promise<PaginatedResponse<InstructorEarning>> {
    const response = await api.get<PaginatedResponse<InstructorEarning>>('/instructor/earnings', {
      params: { page, size },
    });
    return response.data;
  }

  /** Paginated payout history */
  async getPayouts(page = 0, size = 10): Promise<PaginatedResponse<Payout>> {
    const response = await api.get<PaginatedResponse<Payout>>('/instructor/payouts', {
      params: { page, size },
    });
    return response.data;
  }

  /** Request a payout */
  async requestPayout(data: PayoutRequest): Promise<Payout> {
    const response = await api.post<Payout>('/instructor/payouts/request', data);
    return response.data;
  }

  // ============================================
  // Assignments
  // ============================================

  async getMyAssignments(page = 0, size = 10): Promise<AssignmentsPageResponse> {
    const response = await api.get<AssignmentsPageResponse>('/instructor/assignments', {
      params: { page, size },
    });
    return response.data;
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await api.get<Assignment>(`/instructor/assignments/${id}`);
    return response.data;
  }

  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    const response = await api.post<Assignment>('/instructor/assignments', data);
    return response.data;
  }

  async updateAssignment(id: string, data: Partial<CreateAssignmentRequest>): Promise<Assignment> {
    const response = await api.put<Assignment>(`/instructor/assignments/${id}`, data);
    return response.data;
  }

  async deleteAssignment(id: string): Promise<void> {
    await api.delete(`/instructor/assignments/${id}`);
  }
}

export const instructorService = new InstructorService();
export default instructorService;
