import api from './axios.config';
import {
  Course,
  CourseModule,
  CourseReview,
  CreateReviewRequest,
  Enrollment,
  LessonDetail,
  LessonProgress,
  PaginatedResponse,
  CourseQueryParams,
  CourseCategory,
  PlatformStats,
  FeaturedInstructor,
  PublicInstructorProfile,
} from './types';
import { DEFAULT_PAGE_SIZE } from '../../environment';

class CourseService {
  // ============================================
  // Course Listing & Details
  // ============================================

  // Get all courses with filters and pagination
  async getCourses(params: CourseQueryParams = {}): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses', {
      params: {
        page: params.page || 0,
        size: params.size || DEFAULT_PAGE_SIZE,
        ...params,
      },
    });
    return response.data;
  }

  // Get beginner courses
  async getBeginnerCourses(page = 0, size = DEFAULT_PAGE_SIZE): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses/beginner', {
      params: { page, size },
    });
    return response.data;
  }

  // Get premium courses
  async getPremiumCourses(page = 0, size = DEFAULT_PAGE_SIZE): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses/premium', {
      params: { page, size },
    });
    return response.data;
  }

  // Get popular courses
  async getPopularCourses(limit = 8): Promise<Course[]> {
    const response = await api.get<Course[]>('/courses/popular', {
      params: { limit },
    });
    return response.data;
  }

  // Get latest courses
  async getLatestCourses(limit = 8): Promise<Course[]> {
    const response = await api.get<Course[]>('/courses/latest', {
      params: { limit },
    });
    return response.data;
  }

  // Get course by ID
  async getCourseById(id: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  }

  // Get course by slug
  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/slug/${slug}`);
    return response.data;
  }

  // Get course curriculum (modules and lessons)
  async getCourseCurriculum(courseId: string): Promise<CourseModule[]> {
    const response = await api.get<{ modules: CourseModule[] }>(`/courses/${courseId}/curriculum`);
    return response.data?.modules || [];
  }

  // ============================================
  // Categories
  // ============================================

  // Get all categories
  async getCategories(): Promise<CourseCategory[]> {
    try {
      const response = await api.get('/categories');
      // The axios interceptor already unwraps ApiResponse
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('courseService.getCategories error:', error);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<CourseCategory> {
    const response = await api.get<CourseCategory>(`/categories/${id}`);
    return response.data;
  }

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<CourseCategory> {
    const response = await api.get<CourseCategory>(`/categories/slug/${slug}`);
    return response.data;
  }

  // ============================================
  // Enrollment
  // ============================================

  // Enroll in a course
  async enrollInCourse(courseId: string): Promise<Enrollment> {
    const response = await api.post<Enrollment>(`/courses/${courseId}/enroll`);
    return response.data;
  }

  // Get user's enrolled courses
  async getMyEnrolledCourses(page = 0, size = DEFAULT_PAGE_SIZE): Promise<PaginatedResponse<Enrollment>> {
    const response = await api.get<PaginatedResponse<Enrollment>>('/courses/my-courses', {
      params: { page, size },
    });
    return response.data;
  }

  // ============================================
  // Wishlist
  // ============================================

  // Add course to wishlist
  async addToWishlist(courseId: string): Promise<void> {
    await api.post(`/courses/${courseId}/wishlist`);
  }

  // Remove course from wishlist
  async removeFromWishlist(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/wishlist`);
  }

  // Get user's wishlist
  async getWishlist(page = 0, size = DEFAULT_PAGE_SIZE): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses/wishlist', {
      params: { page, size },
    });
    return response.data;
  }

  // ============================================
  // Reviews
  // ============================================

  // Get course reviews
  async getCourseReviews(courseId: string, page = 0, size = DEFAULT_PAGE_SIZE): Promise<PaginatedResponse<CourseReview>> {
    const response = await api.get<PaginatedResponse<CourseReview>>(`/courses/${courseId}/reviews`, {
      params: { page, size },
    });
    return response.data;
  }

  // Create a review
  async createReview(courseId: string, review: CreateReviewRequest): Promise<CourseReview> {
    const response = await api.post<CourseReview>(`/courses/${courseId}/reviews`, review);
    return response.data;
  }

  // Update a review
  async updateReview(courseId: string, reviewId: string, review: CreateReviewRequest): Promise<CourseReview> {
    const response = await api.put<CourseReview>(`/courses/${courseId}/reviews/${reviewId}`, review);
    return response.data;
  }

  // Delete a review
  async deleteReview(courseId: string, reviewId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/reviews/${reviewId}`);
  }

  // ============================================
  // Lessons & Progress
  // ============================================

  // Get lesson details
  async getLessonDetail(lessonId: string): Promise<LessonDetail> {
    const response = await api.get<LessonDetail>(`/lessons/${lessonId}`);
    return response.data;
  }

  // Get signed video URL for lesson
  async getLessonVideoUrl(lessonId: string): Promise<{ videoUrl: string; expiresAt: string }> {
    const response = await api.get<{ videoUrl: string; expiresAt: string }>(`/lessons/${lessonId}/video-url`);
    return response.data;
  }

  // Update lesson progress
  async updateLessonProgress(lessonId: string, watchedSeconds: number): Promise<LessonProgress> {
    const response = await api.post<LessonProgress>(`/lessons/${lessonId}/progress`, {
      watchedSeconds,
    });
    return response.data;
  }

  // Mark lesson as complete
  async completeLessonProgress(lessonId: string): Promise<LessonProgress> {
    const response = await api.post<LessonProgress>(`/lessons/${lessonId}/complete`);
    return response.data;
  }

  // Get lesson resources
  async getLessonResources(lessonId: string): Promise<{ id: string; name: string; url: string; type: string }[]> {
    const response = await api.get<{ id: string; name: string; url: string; type: string }[]>(`/lessons/${lessonId}/resources`);
    return response.data;
  }

  // ============================================
  // Platform Stats (public)
  // ============================================

  async getPlatformStats(): Promise<PlatformStats> {
    const response = await api.get<PlatformStats>('/courses/stats');
    return response.data;
  }

  // Get featured instructors
  async getFeaturedInstructors(limit = 8): Promise<FeaturedInstructor[]> {
    const response = await api.get<FeaturedInstructor[]>('/courses/featured-instructors', {
      params: { limit },
    });
    return response.data;
  }

  // ============================================
  // Public Instructor Profile
  // ============================================

  async getInstructorProfile(instructorId: string): Promise<PublicInstructorProfile> {
    const response = await api.get<PublicInstructorProfile>(`/courses/instructors/${instructorId}`);
    return response.data;
  }

  async getInstructorCourses(instructorId: string, page = 0, size = 12): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>(`/courses/instructors/${instructorId}/courses`, {
      params: { page, size },
    });
    return response.data;
  }
}

export const courseService = new CourseService();
export default courseService;
