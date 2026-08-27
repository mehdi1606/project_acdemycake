import api, { apiMultipart } from './axios.config';
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

// Admin-editable subscription pricing (dynamic, DB-backed)
export interface PricingSettings {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  /** Academy WhatsApp number for live-masterclass reservations ('' when unset). */
  masterclassWhatsapp?: string;
}

// Aggregate revenue stats from CMI payments (server-computed over the whole dataset)
export interface TransactionStats {
  totalRevenue: number;        // realised: COMPLETED payments
  subscriptionRevenue: number; // COMPLETED + SUBSCRIPTION
  courseRevenue: number;       // COMPLETED + COURSE_PURCHASE
  pendingAmount: number;       // SUM of PENDING payments (in-flight)
  completedCount: number;
  pendingCount: number;
  currency: string;            // "MAD"
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

interface SubscriptionItem {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
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
  async getUserById(userId: string | number): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`/admin/users/${userId}`);
    return response.data;
  }

  // Ban user
  async banUser(userId: string | number, reason?: string): Promise<void> {
    await api.post(`/admin/users/${userId}/ban`, null, { params: { reason } });
  }

  // Unban user
  async unbanUser(userId: string | number): Promise<void> {
    await api.post(`/admin/users/${userId}/unban`);
  }

  // Create user (admin) — generates password and sends credentials email
  async createUser(data: { fullName: string; email: string; role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }): Promise<AdminUser> {
    const response = await api.post<{ data: AdminUser; message: string }>('/admin/users', data);
    return response.data.data;
  }

  // Delete user
  async deleteUser(userId: string | number): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  }

  // Manually activate yearly subscription for a user (admin)
  async activateSubscription(userId: string | number): Promise<void> {
    await api.post(`/admin/users/${userId}/activate-subscription`);
  }

  // Get all instructors (admin only)
  async getInstructors(
    page = 0,
    size = 12,
    search?: string
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/instructors', {
      params: { page, size, search },
    });
    return response.data;
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

  // Aggregate revenue stats from CMI payments (whole dataset, not just one page)
  async getTransactionStats(): Promise<TransactionStats> {
    const response = await api.get<TransactionStats>('/admin/transactions/stats');
    return response.data;
  }

  // ── Subscription pricing (dynamic) ──────────────────────────────────────────
  async getPricingSettings(): Promise<PricingSettings> {
    const response = await api.get<PricingSettings>('/admin/settings/pricing');
    return response.data;
  }

  async updatePricingSettings(
    yearlyPrice: number,
    monthlyPrice?: number,
    masterclassWhatsapp?: string,
  ): Promise<PricingSettings> {
    const body: Record<string, number | string> = { yearlyPrice };
    if (monthlyPrice != null) body.monthlyPrice = monthlyPrice;
    if (masterclassWhatsapp != null) body.masterclassWhatsapp = masterclassWhatsapp;
    const response = await api.put<PricingSettings>('/admin/settings/pricing', body);
    return response.data;
  }

  // ============================================
  // Category Management
  // ============================================

  // Get all categories
  async getCategories(): Promise<CourseCategory[]> {
    const response = await api.get('/categories');
    if (Array.isArray(response.data)) return response.data;
    return [];
  }

  async createCategory(data: { name: string; description?: string; displayOrder?: number; nameEn?: string; nameAr?: string; descriptionEn?: string; descriptionAr?: string }): Promise<CourseCategory> {
    const response = await api.post('/categories', data);
    return response.data;
  }

  async updateCategory(categoryId: string, data: { name?: string; description?: string; displayOrder?: number; nameEn?: string; nameAr?: string; descriptionEn?: string; descriptionAr?: string }): Promise<CourseCategory> {
    const response = await api.put(`/categories/${categoryId}`, data);
    return response.data;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/categories/${categoryId}`);
  }

  async uploadCategoryImage(categoryId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiMultipart.post(`/categories/${categoryId}/image`, formData);
    return response.data;
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

  // ============================================
  // Subscriptions
  // ============================================

  async getSubscriptions(page = 0, size = 20, status?: string): Promise<PaginatedResponse<SubscriptionItem>> {
    const response = await api.get<PaginatedResponse<SubscriptionItem>>('/admin/subscriptions', {
      params: { page, size, status },
    });
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
