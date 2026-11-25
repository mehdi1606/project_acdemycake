package com.academy.dto.response;

import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private String phone;
    private UserRole role;
    private Boolean isEmailVerified;
    private SubscriptionStatus subscriptionStatus;
    private LocalDateTime subscriptionEndDate;
    private String socialLinks;
    private LocalDateTime createdAt;
    private Boolean mustChangePassword;
    private Long totalCourses;
    private Long totalStudents;
    // Ban state — Lombok generates getIsBanned() for a Boolean, so the JSON key is "isBanned".
    private Boolean isBanned;
    /** Courses this user has completed — drives their real badge level (admin lists). */
    private Integer completedCourses;
    /** Badge ladder numbers (students) — filled by BadgeStatsService for /auth/me and admin lists. */
    private Integer enrolledCourses;
    private Integer completedLessons;
    private Integer certificates;
    private Integer quizzesTaken;
    /** Average best quiz score, 0-100 (null = no quiz yet). */
    private Integer avgQuizScore;
    private Integer gradedAssignments;
    /** Assignment marks as % of their total (null = none marked yet). */
    private Integer avgAssignmentScore;
    private Integer bestAssignmentScore;
    /** Calendar weeks with learning activity (lessons, quizzes, assignments). */
    private Integer activeWeeks;
    private Integer communityPosts;
    /** Community posts + comments. */
    private Integer communityContributions;
    private Integer reviews;
    private Integer completedMasterclasses;
    private Integer liveMasterclasses;
    /** Elite badge: the chef's personal approval (null = not approved). */
    private LocalDateTime eliteApprovedAt;
    private LocalDateTime bannedAt;
    private String banReason;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .phone(user.getPhone())
                .role(user.getRole())
                .isEmailVerified(user.getIsEmailVerified())
                .subscriptionStatus(user.getSubscriptionStatus())
                .subscriptionEndDate(user.getSubscriptionEndDate())
                .socialLinks(user.getSocialLinks())
                .createdAt(user.getCreatedAt())
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .isBanned(Boolean.TRUE.equals(user.getIsBanned()))
                .bannedAt(user.getBannedAt())
                .banReason(user.getBanReason())
                .eliteApprovedAt(user.getEliteApprovedAt())
                .build();
    }
}
