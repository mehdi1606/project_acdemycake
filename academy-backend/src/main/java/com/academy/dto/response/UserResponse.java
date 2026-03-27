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
                .build();
    }
}
