package com.academy.controller;

import com.academy.dto.request.CreateReviewRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.ReviewResponse;
import com.academy.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/reviews")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Student Reviews", description = "Student review management endpoints")
public class StudentReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "Get all reviews written by the current student")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getMyReviews(page, size)));
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "Update a review by ID (must be the owner)")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateMyReview(
            @PathVariable UUID reviewId,
            @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.updateMyReview(reviewId, request)));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "Delete a review by ID (must be the owner)")
    public ResponseEntity<ApiResponse<Void>> deleteMyReview(@PathVariable UUID reviewId) {
        reviewService.deleteMyReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
