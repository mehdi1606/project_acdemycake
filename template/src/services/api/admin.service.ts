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
  ebookRevenue: number;        // COMPLETED + EBOOK_PURCHASE
  pendingAmount: number;       // SUM of PENDING payments (in-flight)
  completedCount: number;
  pendingCount: number;
  currency: string;            // "MAD"
}

// Whole-dataset user counts (soft-deleted users excluded)
export interface UserStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
}

// Whole-dataset course counts: `total` plus one key per CourseStatus
export interface CourseStats {
  total: number;
  DRAFT: number;
  PENDING_REVIEW: number;
  PUBLISHED: number;
  ARCHIVED: number;
}

export type UserRoleFilter = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type InstructorSort = 'newest' | 'oldest' | 'name';
export type ReportType = 'revenue' | 'users' | 'courses' | 'subscriptions';

/** Aggregate report: a flat map of figures (plus `generatedAt` / `currency`). */
export type AdminReport = Record<string, number | string | null>;

// Analytics for a period. Money = COMPLETED payment transactions created in the period.
export interface Analytics {
  period: string;
  startDate: string;
  totalRevenue: number;        // revenue of the period
  coursesSold: number;         // COMPLETED COURSE_PURCHASE count in the period
  totalUsers: number;          // all non-deleted users
  newUsers: number;            // sign-ups in the period
  activeSubscriptions: number;
  newEnrollments: number;
  topCourses: {
    courseId: string;
    title: string | null;      // null when the course was deleted since
    sales: number;
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
    search?: string,
    role?: UserRoleFilter
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', {
      params: { page, size, search, role },
    });
    return response.data;
  }

  // Whole-dataset user counts per role
  async getUserStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/admin/users/stats');
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

  /** Elite badge: the chef approves (true) or withdraws (false) a student's Elite approval. */
  async setEliteApproval(userId: string | number, approved: boolean): Promise<void> {
    await api.post(`/admin/users/${userId}/elite`, null, { params: { approved } });
  }

  // Unban user
  async unbanUser(userId: string | number): Promise<void> {
    await api.post(`/admin/users/${userId}/unban`);
  }

  // Create user (admin) — generates password and sends credentials email
  async createUser(data: { fullName: string; email: string; role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }): Promise<AdminUser> {
    // The axios interceptor already unwraps ApiResponse, so response.data is the user.
    const response = await api.post<AdminUser>('/admin/users', data);
    return response.data;
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
    search?: string,
    sort: InstructorSort = 'newest'
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/instructors', {
      params: { page, size, search, sort },
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

  // Whole-dataset course counts per status
  async getCourseStats(): Promise<CourseStats> {
    const response = await api.get<CourseStats>('/admin/courses/stats');
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

  // Reject course (sends it back to DRAFT — never deletes). Backend reads `reason` as a query param.
  async rejectCourse(courseId: string, reason: string): Promise<void> {
    await api.post(`/admin/courses/${courseId}/reject`, null, { params: { reason } });
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
    size = 20,
    status?: string,
    type?: string
  ): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>('/admin/transactions', {
      params: { page, size, status: status || undefined, type: type || undefined },
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

  // Get an aggregate report (flat map of figures) for one report type
  async getReports(type: ReportType = 'revenue'): Promise<AdminReport> {
    const response = await api.get<AdminReport>('/admin/reports', {
      params: { type },
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
