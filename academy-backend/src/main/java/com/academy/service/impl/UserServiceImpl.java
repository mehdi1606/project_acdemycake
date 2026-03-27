package com.academy.service.impl;

import com.academy.dto.request.ChangePasswordRequest;
import com.academy.dto.request.UpdateProfileRequest;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.User;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.UserRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.FileStorageService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public UserResponse getUserById(UUID id) {
        User user = findById(id);
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getSocialLinks() != null) {
            user.setSocialLinks(request.getSocialLinks());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public String uploadAvatar(MultipartFile file) {
        User user = getCurrentUser();

        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteFile(user.getAvatarUrl());
        }

        String avatarUrl = fileStorageService.storeFile(file, "avatars");
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("Avatar uploaded for user: {}", user.getEmail());

        return avatarUrl;
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void updateNotificationPreferences(String preferences) {
        User user = getCurrentUser();
        user.setNotificationPreferences(preferences);
        userRepository.save(user);
    }

    @Override
    public String getNotificationPreferences() {
        User user = getCurrentUser();
        return user.getNotificationPreferences();
    }

    @Override
    public PageResponse<UserResponse> getAllUsers(int page, int size, String search) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users;

        if (search != null && !search.isBlank()) {
            users = userRepository.searchUsers(search, pageRequest);
        } else {
            users = userRepository.findAll(pageRequest);
        }

        return PageResponse.from(users, UserResponse::fromEntity);
    }

    @Override
    @Transactional
    public void banUser(UUID userId, String reason) {
        User user = findById(userId);
        user.setIsBanned(true);
        user.setBannedAt(LocalDateTime.now());
        user.setBanReason(reason);
        userRepository.save(user);

        log.info("User banned: {} - Reason: {}", user.getEmail(), reason);
    }

    @Override
    @Transactional
    public void unbanUser(UUID userId) {
        User user = findById(userId);
        user.setIsBanned(false);
        user.setBannedAt(null);
        user.setBanReason(null);
        userRepository.save(user);

        log.info("User unbanned: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        User user = findById(userId);
        userRepository.delete(user);

        log.info("User deleted: {}", user.getEmail());
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return findById(userPrincipal.getId());
    }
}
