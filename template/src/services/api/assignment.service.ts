import api from './axios.config';
import {
  Assignment,
  Submission,
  CreateAssignmentRequest,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
  PaginatedResponse,
  ApiResponse,
} from './types';

class AssignmentService {
  // ── Instructor ────────────────────────────────────────────────────────────

  async getMyAssignments(page = 0, size = 10): Promise<PaginatedResponse<Assignment>> {
    const res = await api.get<ApiResponse<PaginatedResponse<Assignment>>>('/instructor/assignments', {
      params: { page, size },
    });
    return res.data.data;
  }

  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    const res = await api.post<ApiResponse<Assignment>>('/instructor/assignments', data);
    return res.data.data;
  }

  async updateAssignment(id: string, data: Partial<CreateAssignmentRequest>): Promise<Assignment> {
    const res = await api.put<ApiResponse<Assignment>>(`/instructor/assignments/${id}`, data);
    return res.data.data;
  }

  async deleteAssignment(id: string): Promise<void> {
    await api.delete(`/instructor/assignments/${id}`);
  }

  async getSubmissionsForAssignment(
    assignmentId: string,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<Submission>> {
    const res = await api.get<ApiResponse<PaginatedResponse<Submission>>>(
      `/instructor/assignments/${assignmentId}/submissions`,
      { params: { page, size } },
    );
    return res.data.data;
  }

  async gradeSubmission(submissionId: string, data: GradeSubmissionRequest): Promise<Submission> {
    const res = await api.post<ApiResponse<Submission>>(
      `/instructor/assignments/submissions/${submissionId}/grade`,
      data,
    );
    return res.data.data;
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async getStudentAssignments(page = 0, size = 10): Promise<PaginatedResponse<Assignment>> {
    const res = await api.get<ApiResponse<PaginatedResponse<Assignment>>>('/student/assignments', {
      params: { page, size },
    });
    return res.data.data;
  }

  async submitAssignment(assignmentId: string, data: SubmitAssignmentRequest): Promise<Submission> {
    const res = await api.post<ApiResponse<Submission>>(
      `/student/assignments/${assignmentId}/submit`,
      data,
    );
    return res.data.data;
  }

  async getMySubmission(assignmentId: string): Promise<Submission> {
    const res = await api.get<ApiResponse<Submission>>(
      `/student/assignments/${assignmentId}/my-submission`,
    );
    return res.data.data;
  }
}

export const assignmentService = new AssignmentService();
