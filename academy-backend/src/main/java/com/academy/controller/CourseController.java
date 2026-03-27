package com.academy.controller;

import com.academy.dto.request.CreateReviewRequest;
import com.academy.dto.response.*;
import com.academy.entity.enums.CourseLevel;
import com.academy.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management endpoints")
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final ReviewService reviewService;
    private final WishlistService wishlistService;

    @GetMapping("/stats")
    @Operation(summary = "Get public platform statistics")
    public ResponseEntity<ApiResponse<PlatformStatsResponse>> getPlatformStats() {
        PlatformStatsResponse response = courseService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/featured-instructors")
    @Operation(summary = "Get featured instructors")
    public ResponseEntity<ApiResponse<List<FeaturedInstructorResponse>>> getFeaturedInstructors(
            @RequestParam(defaultValue = "8") int limit) {
        List<FeaturedInstructorResponse> response = courseService.getFeaturedInstructors(limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/instructors/{instructorId}")
    @Operation(summary = "Get public instructor profile")
    public ResponseEntity<ApiResponse<PublicInstructorProfileResponse>> getInstructorProfile(
            @PathVariable UUID instructorId) {
        PublicInstructorProfileResponse response = courseService.getInstructorPublicProfile(instructorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/instructors/{instructorId}/courses")
    @Operation(summary = "Get published courses by instructor")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getInstructorCourses(
            @PathVariable UUID instructorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        PageResponse<CourseResponse> response = courseService.getCoursesByInstructor(instructorId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get all published courses with pagination and filters")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) CourseLevel level,
            @RequestParam(required = false) String sortBy) {

        PageResponse<CourseResponse> response = courseService.getAllCourses(page, size, search, categoryId, level, sortBy);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/beginner")
    @Operation(summary = "Get beginner courses (available with subscription)")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getBeginnerCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<CourseResponse> response = courseService.getBeginnerCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/premium")
    @Operation(summary = "Get premium courses (require individual purchase)")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getPremiumCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<CourseResponse> response = courseService.getPremiumCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/popular")
    @Operation(summary = "Get popular courses")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getPopularCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<CourseResponse> response = courseService.getPopularCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/latest")
    @Operation(summary = "Get latest courses")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getLatestCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<CourseResponse> response = courseService.getLatestCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID id) {
        CourseResponse response = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get course by slug")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseBySlug(@PathVariable String slug) {
        CourseResponse response = courseService.getCourseBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/curriculum")
    @Operation(summary = "Get course curriculum")
    public ResponseEntity<ApiResponse<CurriculumResponse>> getCourseCurriculum(@PathVariable UUID id) {
        CurriculumResponse response = courseService.getCourseCurriculum(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/enroll")
    @Operation(summary = "Enroll in a course")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollInCourse(@PathVariable UUID id) {
        EnrollmentResponse response = enrollmentService.enrollUser(id);
        return ResponseEntity.ok(ApiResponse.success("Enrolled successfully", response));
    }

    @GetMapping("/my-courses")
    @Operation(summary = "Get enrolled courses for current user")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentResponse>>> getMyCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<EnrollmentResponse> response = enrollmentService.getMyEnrollments(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/reviews")
    @Operation(summary = "Get course reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getCourseReviews(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<ReviewResponse> response = reviewService.getCourseReviews(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/reviews")
    @Operation(summary = "Create a review for a course")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable UUID id,
            @Valid @RequestBody CreateReviewRequest request) {

        ReviewResponse response = reviewService.createReview(id, request);
        return ResponseEntity.ok(ApiResponse.success("Review created", response));
    }

    @PutMapping("/{courseId}/reviews/{reviewId}")
    @Operation(summary = "Update a review")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable UUID courseId,
            @PathVariable UUID reviewId,
            @Valid @RequestBody CreateReviewRequest request) {

        ReviewResponse response = reviewService.updateReview(courseId, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success("Review updated", response));
    }

    @DeleteMapping("/{courseId}/reviews/{reviewId}")
    @Operation(summary = "Delete a review")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable UUID courseId,
            @PathVariable UUID reviewId) {

        reviewService.deleteReview(courseId, reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted"));
    }

    @PostMapping("/{id}/wishlist")
    @Operation(summary = "Add course to wishlist")
    public ResponseEntity<ApiResponse<Void>> addToWishlist(@PathVariable UUID id) {
        wishlistService.addToWishlist(id);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist"));
    }

    @DeleteMapping("/{id}/wishlist")
    @Operation(summary = "Remove course from wishlist")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(@PathVariable UUID id) {
        wishlistService.removeFromWishlist(id);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist"));
    }

    @GetMapping("/wishlist")
    @Operation(summary = "Get user's wishlist")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<CourseResponse> response = wishlistService.getWishlist(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
