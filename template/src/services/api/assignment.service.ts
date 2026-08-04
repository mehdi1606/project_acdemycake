import api, { apiMultipart } from './axios.config';
import {
  Assignment,
  Submission,
  CreateAssignmentRequest,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
  PaginatedResponse,
} from './types';

/**
 * NOTE: the axios interceptor in axios.config.ts already unwraps the backend's
 * `ApiResponse { success, message, data }` envelope into `response.data`.
 * So every call here reads `res.data` — reading `res.data.data` would unwrap
 * twice and yield `undefined`.
 */
class AssignmentService {
  // ── Instructor ────────────────────────────────────────────────────────────

  async getMyAssignments(page = 0, size = 10): Promise<PaginatedResponse<Assignment>> {
    const res = await api.get<PaginatedResponse<Assignment>>('/instructor/assignments', {
      params: { page, size },
    });
    return res.data;
  }

  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    const res = await api.post<Assignment>('/instructor/assignments', data);
    return res.data;
  }

  async updateAssignment(id: string, data: Partial<CreateAssignmentRequest>): Promise<Assignment> {
    const res = await api.put<Assignment>(`/instructor/assignments/${id}`, data);
    return res.data;
  }

  async deleteAssignment(id: string): Promise<void> {
    await api.delete(`/instructor/assignments/${id}`);
  }

  async getSubmissionsForAssignment(
    assignmentId: string,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<Submission>> {
    const res = await api.get<PaginatedResponse<Submission>>(
      `/instructor/assignments/${assignmentId}/submissions`,
      { params: { page, size } },
    );
    return res.data;
  }

  async gradeSubmission(submissionId: string, data: GradeSubmissionRequest): Promise<Submission> {
    const res = await api.post<Submission>(
      `/instructor/assignments/submissions/${submissionId}/grade`,
      data,
    );
    return res.data;
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async getStudentAssignments(page = 0, size = 10): Promise<PaginatedResponse<Assignment>> {
    const res = await api.get<PaginatedResponse<Assignment>>('/student/assignments', {
      params: { page, size },
    });
    return res.data;
  }

  /** Published assignments of a single enrolled course (for the course page). */
  async getAssignmentsForCourse(courseId: string): Promise<Assignment[]> {
    const res = await api.get<Assignment[]>(`/student/assignments/course/${courseId}`);
    return res.data;
  }

  /** Upload the student's answer file; returns the stored URL to put in `fileUrl`. */
  async uploadSubmissionFile(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiMultipart.post<string>('/student/assignments/upload', form);
    return res.data;
  }

  async submitAssignment(assignmentId: string, data: SubmitAssignmentRequest): Promise<Submission> {
    const res = await api.post<Submission>(`/student/assignments/${assignmentId}/submit`, data);
    return res.data;
  }

  async getMySubmission(assignmentId: string): Promise<Submission> {
    const res = await api.get<Submission>(`/student/assignments/${assignmentId}/my-submission`);
    return res.data;
  }
}

export const assignmentService = new AssignmentService();
