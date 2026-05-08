package com.academy.service.impl;

import com.academy.dto.request.*;
import com.academy.dto.response.AuthResponse;
import com.academy.dto.response.UserResponse;
import com.academy.entity.RefreshToken;
import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.exception.UnauthorizedException;
import com.academy.repository.RefreshTokenRepository;
import com.academy.repository.UserRepository;
import com.academy.security.JwtTokenProvider;
import com.academy.security.UserPrincipal;
import com.academy.service.AuthService;
import com.academy.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email is already registered");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.STUDENT)
                .isEmailVerified(false)
                .emailVerificationToken(verificationToken)
                .emailVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .subscriptionStatus(SubscriptionStatus.NONE)
                .isBanned(false)
                .build();

        user = userRepository.save(user);

        emailService.sendVerificationEmail(user, verificationToken);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createRefreshToken(user, null);

        log.info("New user registered: {}", user.getEmail());

        return AuthResponse.of(accessToken, refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                UserResponse.fromEntity(user));
    }
    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request) {
        // Create user with ADMIN role
        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.ADMIN) // Set as ADMIN
                .isEmailVerified(true) // Auto-verify
                .build();

        user = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createRefreshToken(user, null);

        return AuthResponse.of(accessToken, refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                UserResponse.fromEntity(user));
    }
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsBanned()) {
            throw new UnauthorizedException("Your account has been banned. Reason: " + user.getBanReason());
        }

        if (!user.getIsEmailVerified()) {
            throw new UnauthorizedException("Please verify your email address before logging in. Check your inbox for the verification link.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createRefreshToken(user, request.getDeviceInfo());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.of(accessToken, refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                UserResponse.fromEntity(user));
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!refreshToken.isValid()) {
            throw new UnauthorizedException("Refresh token has expired or been revoked");
        }

        User user = refreshToken.getUser();

        if (user.getIsBanned()) {
            throw new UnauthorizedException("Your account has been banned");
        }

        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = createRefreshToken(user, refreshToken.getDeviceInfo());

        return AuthResponse.of(newAccessToken, newRefreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                UserResponse.fromEntity(user));
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setIsRevoked(true);
                    refreshTokenRepository.save(token);
                });
        SecurityContextHolder.clearContext();
    }

    @Override
    @Transactional
    public void logoutAll() {
        User currentUser = getCurrentUserEntity();
        refreshTokenRepository.revokeAllByUser(currentUser);
        SecurityContextHolder.clearContext();
        log.info("All sessions logged out for user: {}", currentUser.getEmail());
    }

    @Override
    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmailVerificationToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (user.getEmailVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiresAt(null);
        userRepository.save(user);

        emailService.sendWelcomeEmail(user);

        log.info("Email verified for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user, verificationToken);

        log.info("Verification email resent to: {}", email);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElse(null);

        if (user != null) {
            String resetToken = UUID.randomUUID().toString();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            emailService.sendPasswordResetEmail(user, resetToken);
            log.info("Password reset email sent to: {}", request.getEmail());
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password reset for user: {}", user.getEmail());
    }

    @Override
    public UserResponse getCurrentUser() {
        User user = getCurrentUserEntity();
        return UserResponse.fromEntity(user);
    }

    private String createRefreshToken(User user, String deviceInfo) {
        String token = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .isRevoked(false)
                .deviceInfo(deviceInfo)
                .build();

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Not authenticated");
        }

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
