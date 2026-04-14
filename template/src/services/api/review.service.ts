import api from './axios.config';
import { PaginatedResponse } from './types';

export interface MyReview {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  reviewText: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  reviewText?: string;
}

class ReviewService {
  async getMyReviews(page = 0, size = 10): Promise<PaginatedResponse<MyReview>> {
    const response = await api.get<PaginatedResponse<MyReview>>('/student/reviews', {
      params: { page, size },
    });
    return response.data;
  }

  async updateMyReview(reviewId: string, data: UpdateReviewRequest): Promise<MyReview> {
    const response = await api.put<MyReview>(`/student/reviews/${reviewId}`, data);
    return response.data;
  }

  async deleteMyReview(reviewId: string): Promise<void> {
    await api.delete(`/student/reviews/${reviewId}`);
  }
}

export const reviewService = new ReviewService();
export default reviewService;
