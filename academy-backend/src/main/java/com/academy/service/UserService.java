package com.academy.service;

import com.academy.dto.request.ChangePasswordRequest;
import com.academy.dto.request.UpdateProfileRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface UserService {

    User findById(UUID id);

    User findByEmail(String email);

    UserResponse getUserById(UUID id);

    UserResponse updateProfile(UpdateProfileRequest request);

    String uploadAvatar(MultipartFile file);

    void changePassword(ChangePasswordRequest request);

    void updateNotificationPreferences(String preferences);

    String getNotificationPreferences();

    PageResponse<UserResponse> getAllUsers(int page, int size, String search);

    void banUser(UUID userId, String reason);

    void unbanUser(UUID userId);

    void deleteUser(UUID userId);
}
