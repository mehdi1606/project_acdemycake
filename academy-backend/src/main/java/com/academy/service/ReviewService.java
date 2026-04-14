package com.academy.service;

import com.academy.dto.request.CreateReviewRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.ReviewResponse;

import java.util.UUID;

public interface ReviewService {

    PageResponse<ReviewResponse> getCourseReviews(UUID courseId, int page, int size);

    PageResponse<ReviewResponse> getMyReviews(int page, int size);

    ReviewResponse createReview(UUID courseId, CreateReviewRequest request);

    ReviewResponse updateReview(UUID courseId, UUID reviewId, CreateReviewRequest request);

    ReviewResponse updateMyReview(UUID reviewId, CreateReviewRequest request);

    void deleteReview(UUID courseId, UUID reviewId);

    void deleteMyReview(UUID reviewId);

    void updateCourseRating(UUID courseId);
}
