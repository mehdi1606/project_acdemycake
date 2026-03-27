package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class DashboardResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentDashboard {
        private Integer enrolledCoursesCount;
        private Integer completedCoursesCount;
        private Integer certificatesCount;
        private List<EnrollmentResponse> continueWatching;
        private List<CourseResponse> recommendedCourses;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorDashboard {
        private Integer totalStudents;
        private Integer totalCourses;
        private BigDecimal totalEarnings;
        private BigDecimal pendingEarnings;
        private BigDecimal monthlyEarnings;
        private List<CourseStats> topCourses;
        private List<RecentEnrollment> recentEnrollments;
        private List<MonthlyRevenue> revenueHistory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDashboard {
        private Integer totalUsers;
        private Integer totalCourses;
        private Integer totalEnrollments;
        private Integer activeSubscriptions;
        private BigDecimal totalRevenue;
        private BigDecimal monthlyRevenue;
        private List<CourseStats> topCourses;
        private List<UserStats> topInstructors;
        private List<MonthlyRevenue> revenueHistory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseStats {
        private CourseResponse course;
        private Integer enrollmentsCount;
        private BigDecimal revenue;
        private BigDecimal averageRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {
        private UserResponse user;
        private Integer studentsCount;
        private Integer coursesCount;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentEnrollment {
        private UserResponse student;
        private CourseResponse course;
        private String enrolledAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private String month;
        private BigDecimal revenue;
        private Integer enrollments;
    }
}
