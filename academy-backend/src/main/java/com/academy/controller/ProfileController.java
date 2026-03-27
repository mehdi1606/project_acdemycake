package com.academy.controller;

import com.academy.dto.request.ChangePasswordRequest;
import com.academy.dto.request.UpdateProfileRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.UserResponse;
import com.academy.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile management")
public class ProfileController {

    private final UserService userService;

    @PutMapping
    @Operation(summary = "Update user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", response));
    }

    @PostMapping("/avatar")
    @Operation(summary = "Upload profile avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String avatarUrl = userService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded", avatarUrl));
    }

    @PutMapping("/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences")
    public ResponseEntity<ApiResponse<String>> getPreferences() {
        String preferences = userService.getNotificationPreferences();
        return ResponseEntity.ok(ApiResponse.success(preferences));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences")
    public ResponseEntity<ApiResponse<Void>> updatePreferences(@RequestBody String preferences) {
        userService.updateNotificationPreferences(preferences);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated"));
    }
}
