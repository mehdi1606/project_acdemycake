package com.academy.service.impl;

import com.academy.dto.request.CreateReviewRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.ReviewResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseReview;
import com.academy.entity.User;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.CourseReviewRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.CourseService;
import com.academy.service.ReviewService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final CourseReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseService courseService;
    private final UserService userService;

    @Override
    public PageResponse<ReviewResponse> getCourseReviews(UUID courseId, int page, int size) {
        Course course = courseService.findById(courseId);
        Pageable pageable = PageRequest.of(page, size);

        Page<CourseReview> reviewsPage = reviewRepository.findByCourseAndIsVisibleTrueOrderByCreatedAtDesc(course, pageable);

        return PageResponse.from(reviewsPage, ReviewResponse::fromEntity);
    }

    @Override
    public PageResponse<ReviewResponse> getMyReviews(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<CourseReview> reviewsPage = reviewRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);

        return PageResponse.from(reviewsPage, ReviewResponse::fromEntity);
    }

    @Override
    @Transactional
    public ReviewResponse createReview(UUID courseId, CreateReviewRequest request) {
        User currentUser = getCurrentUser();
        Course course = courseService.findById(courseId);

        // Check if user already reviewed this course
        if (reviewRepository.existsByUserAndCourse(currentUser, course)) {
            throw new BadRequestException("You have already reviewed this course");
        }

        // Check if user is enrolled in the course
        boolean isEnrolled = enrollmentRepository.existsByUserAndCourse(currentUser, course);

        CourseReview review = CourseReview.builder()
                .course(course)
                .user(currentUser)
                .rating(request.getRating())
                .reviewText(request.getReviewText())
                .isVerifiedPurchase(isEnrolled)
                .build();

        review = reviewRepository.save(review);
        log.info("Review created for course: {} by user: {} rating: {}", courseId, currentUser.getEmail(), request.getRating());

        // Update course rating
        updateCourseRating(courseId);

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(UUID courseId, UUID reviewId, CreateReviewRequest request) {
        User currentUser = getCurrentUser();
        CourseReview review = findById(reviewId);

        // Verify ownership
        if (!review.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You can only update your own reviews");
        }

        // Verify course matches
        if (!review.getCourse().getId().equals(courseId)) {
            throw new BadRequestException("Review does not belong to this course");
        }

        review.setRating(request.getRating());
        if (request.getReviewText() != null) {
            review.setReviewText(request.getReviewText());
        }

        review = reviewRepository.save(review);
        log.info("Review updated: {} by user: {}", reviewId, currentUser.getEmail());

        // Update course rating
        updateCourseRating(courseId);

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public void deleteReview(UUID courseId, UUID reviewId) {
        User currentUser = getCurrentUser();
        CourseReview review = findById(reviewId);

        // Verify ownership or admin
        if (currentUser.getRole() != UserRole.ADMIN && !review.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have permission to delete this review");
        }

        // Verify course matches
        if (!review.getCourse().getId().equals(courseId)) {
            throw new BadRequestException("Review does not belong to this course");
        }

        reviewRepository.delete(review);
        log.info("Review deleted: {} by user: {}", reviewId, currentUser.getEmail());

        // Update course rating
        updateCourseRating(courseId);
    }

    @Override
    @Transactional
    public void updateCourseRating(UUID courseId) {
        Course course = courseService.findById(courseId);

        Double averageRating = reviewRepository.calculateAverageRatingByCourse(course);
        long reviewCount = reviewRepository.countByCourseAndIsVisibleTrue(course);

        course.setRatingAverage(averageRating != null ? BigDecimal.valueOf(averageRating) : BigDecimal.ZERO);
        course.setRatingCount((int) reviewCount);

        courseRepository.save(course);
        log.info("Course rating updated: {} average: {} count: {}", courseId, averageRating, reviewCount);
    }

    private CourseReview findById(UUID id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
