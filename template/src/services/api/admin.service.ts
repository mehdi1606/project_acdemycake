import api from './axios.config';
import {
  AdminDashboard,
  AdminUser,
  Course,
  CourseCategory,
  PaymentTransaction,
  PaginatedResponse,
} from './types';

interface AnalyticsPeriod {
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
}

interface Analytics {
  totalRevenue: number;
  totalUsers: number;
  newUsers: number;
  activeSubscriptions: number;
  coursesSold: number;
  topCourses: {
    courseId: number;
    title: string;
    enrollments: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    amount: number;
  }[];
  usersByDay: {
    date: string;
    count: number;
  }[];
}

interface Report {
  id: number;
  type: string;
  reporterId: number;
  reporterName: string;
  targetType: 'POST' | 'COMMENT' | 'USER' | 'COURSE';
  targetId: number;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

class AdminService {
  // ============================================
  // Dashboard
  // ============================================

  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<AdminDashboard>('/admin/dashboard');
    return response.data;
  }

  // ============================================
  // User Management
  // ============================================

  // Get all users
  async getUsers(
    page = 0,
    size = 20,
    search?: string
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', {
      params: { page, size, search },
    });
    return response.data;
  }

  // Get user details
  async getUserById(userId: number): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`/admin/users/${userId}`);
    return response.data;
  }

  // Ban user
  async banUser(userId: number, reason?: string): Promise<void> {
    await api.post(`/admin/users/${userId}/ban`, null, { params: { reason } });
  }

  // Unban user
  async unbanUser(userId: number): Promise<void> {
    await api.post(`/admin/users/${userId}/unban`);
  }

  // Delete user
  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  }

  // ============================================
  // Course Management
  // ============================================

  // Get all courses (admin sees all statuses: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED)
  async getCourses(page = 0, size = 20, status?: string): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/admin/courses', {
      params: { page, size, status },
    });
    return response.data;
  }

  // Get pending review courses
  async getPendingCourses(page = 0, size = 20): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/admin/courses/pending', {
      params: { page, size },
    });
    return response.data;
  }

  // Approve course
  async approveCourse(courseId: string): Promise<Course> {
    const response = await api.post<Course>(`/admin/courses/${courseId}/approve`);
    return response.data;
  }

  // Reject course
  async rejectCourse(courseId: string, reason: string): Promise<Course> {
    const response = await api.post<Course>(`/admin/courses/${courseId}/reject`, { reason });
    return response.data;
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/admin/courses/${courseId}`);
  }

  // ============================================
  // Transactions
  // ============================================

  // Get all transactions
  async getTransactions(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>('/admin/transactions', {
      params: { page, size },
    });
    return response.data;
  }

  // ============================================
  // Category Management
  // ============================================

  // Get all categories
  async getCategories(): Promise<CourseCategory[]> {
    try {
      const response = await api.get('/categories');
      console.log('adminService.getCategories response.data:', response.data);
      // The axios interceptor already unwraps ApiResponse
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('getCategories: response.data is not an array:', response.data);
      return [];
    } catch (error) {
      console.error('adminService.getCategories error:', error);
      throw error;
    }
  }

  // Create category
  async createCategory(data: { name: string; description?: string; displayOrder?: number }): Promise<CourseCategory> {
    try {
      console.log('Creating category:', data);
      const response = await api.post('/categories', data);
      console.log('adminService.createCategory response.data:', response.data);
      return response.data;
    } catch (error) {
      console.error('adminService.createCategory error:', error);
      throw error;
    }
  }

  // Update category
  async updateCategory(categoryId: string, data: { name?: string; description?: string; displayOrder?: number }): Promise<CourseCategory> {
    try {
      console.log('Updating category:', categoryId, data);
      const response = await api.put(`/categories/${categoryId}`, data);
      console.log('adminService.updateCategory response.data:', response.data);
      return response.data;
    } catch (error) {
      console.error('adminService.updateCategory error:', error);
      throw error;
    }
  }

  // Delete category
  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/categories/${categoryId}`);
  }

  // Upload category image
  async uploadCategoryImage(categoryId: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Uploading image for category:', categoryId);
      const response = await api.post(`/categories/${categoryId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('adminService.uploadCategoryImage response.data:', response.data);
      return response.data;
    } catch (error) {
      console.error('adminService.uploadCategoryImage error:', error);
      throw error;
    }
  }

  // ============================================
  // Analytics
  // ============================================

  // Get platform analytics
  async getAnalytics(period: AnalyticsPeriod['period'] = 'MONTH'): Promise<Analytics> {
    const response = await api.get<Analytics>('/admin/analytics', {
      params: { period },
    });
    return response.data;
  }

  // ============================================
  // Reports
  // ============================================

  // Get reports
  async getReports(type?: string, page = 0, size = 20): Promise<PaginatedResponse<Report>> {
    const response = await api.get<PaginatedResponse<Report>>('/admin/reports', {
      params: { type, page, size },
    });
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
