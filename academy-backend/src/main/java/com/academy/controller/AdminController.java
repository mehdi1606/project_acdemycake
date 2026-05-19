package com.academy.controller;

import com.academy.dto.request.AdminCreateUserRequest;
import com.academy.dto.response.*;
import com.academy.entity.PaymentTransaction;
import com.academy.service.*;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final CourseService courseService;
    private final SubscriptionService subscriptionService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse.AdminDashboard>> getDashboard() {
        DashboardResponse.AdminDashboard response = adminService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // User Management
    @PostMapping("/users")
    @Operation(summary = "Create a new user account and send credentials via email")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody AdminCreateUserRequest request) {
        UserResponse response = userService.adminCreateUser(request);
        return ResponseEntity.ok(ApiResponse.success("User created and credentials sent by email", response));
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        PageResponse<UserResponse> response = userService.getAllUsers(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/instructors")
    @Operation(summary = "Get all instructors with pagination and optional search")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getInstructors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search) {

        PageResponse<UserResponse> response = userService.getInstructors(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/users/{id}/ban")
    @Operation(summary = "Ban a user")
    public ResponseEntity<ApiResponse<Void>> banUser(
            @PathVariable UUID id,
            @RequestParam String reason) {

        userService.banUser(id, reason);
        return ResponseEntity.ok(ApiResponse.success("User banned"));
    }

    @PostMapping("/users/{id}/unban")
    @Operation(summary = "Unban a user")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable UUID id) {
        userService.unbanUser(id);
        return ResponseEntity.ok(ApiResponse.success("User unbanned"));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    // Course Management
    @GetMapping("/courses")
    @Operation(summary = "Get all courses (including drafts, pending, published)")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {

        PageResponse<CourseResponse> response = courseService.getAllCoursesForAdmin(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/courses/pending")
    @Operation(summary = "Get courses pending review")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getPendingCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<CourseResponse> response = courseService.getPendingCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/courses/{id}/approve")
    @Operation(summary = "Approve and publish a course")
    public ResponseEntity<ApiResponse<Void>> approveCourse(@PathVariable UUID id) {
        courseService.approveCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course approved and published"));
    }

    @PostMapping("/courses/{id}/reject")
    @Operation(summary = "Reject a course")
    public ResponseEntity<ApiResponse<Void>> rejectCourse(
            @PathVariable UUID id,
            @RequestParam String reason) {
        courseService.rejectCourse(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Course rejected"));
    }

    @DeleteMapping("/courses/{id}")
    @Operation(summary = "Delete a course")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted"));
    }

    // Subscriptions
    @GetMapping("/subscriptions")
    @Operation(summary = "Get all subscriptions (admin)")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionResponse>>> getAllSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {

        PageResponse<SubscriptionResponse> response = subscriptionService.getAllSubscriptions(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Transactions
    @GetMapping("/transactions")
    @Operation(summary = "Get all transactions")
    public ResponseEntity<ApiResponse<PageResponse<PaymentTransaction>>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<PaymentTransaction> response = adminService.getTransactions(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Analytics
    @GetMapping("/analytics")
    @Operation(summary = "Get platform analytics")
    public ResponseEntity<ApiResponse<Object>> getAnalytics(
            @RequestParam(defaultValue = "month") String period) {

        Object response = adminService.getAnalytics(period);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Reports
    @GetMapping("/reports")
    @Operation(summary = "Get reports")
    public ResponseEntity<ApiResponse<Object>> getReports(
            @RequestParam(defaultValue = "revenue") String type) {

        Object response = adminService.getReports(type);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
