package com.academy.service;

import com.academy.dto.request.AdminCreateUserRequest;
import com.academy.dto.request.ChangePasswordRequest;
import com.academy.dto.request.UpdateProfileRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.User;
import com.academy.entity.enums.UserRole;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface UserService {

    UserResponse adminCreateUser(AdminCreateUserRequest request);

    User findById(UUID id);

    User findByEmail(String email);

    UserResponse getUserById(UUID id);

    UserResponse updateProfile(UpdateProfileRequest request);

    String uploadAvatar(MultipartFile file);

    void changePassword(ChangePasswordRequest request);

    void updateNotificationPreferences(String preferences);

    String getNotificationPreferences();

    PageResponse<UserResponse> getAllUsers(int page, int size, String search, UserRole role);

    /** Whole-dataset user counts (non-deleted) for the admin Users page stat cards. */
    Map<String, Long> getUserStats();

    /** @param sort newest (default) | oldest | name */
    PageResponse<UserResponse> getInstructors(int page, int size, String search, String sort);

    void banUser(UUID userId, String reason);

    void unbanUser(UUID userId);

    /** Elite badge: the chef approves (true) or withdraws (false) a student's Elite approval. */
    UserResponse setEliteApproval(UUID userId, boolean approved);

    void deleteUser(UUID userId);
}
