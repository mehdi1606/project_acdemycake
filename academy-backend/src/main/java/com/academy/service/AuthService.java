package com.academy.service;

import com.academy.dto.request.*;
import com.academy.dto.response.AuthResponse;
import com.academy.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

    /** Sign-up. A profile photo is mandatory (1 MB max, JPEG/PNG/WebP). */
    AuthResponse register(RegisterRequest request, MultipartFile avatar);
    AuthResponse registerAdmin(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    void logoutAll();

    void verifyEmail(VerifyEmailRequest request);

    void resendVerificationEmail(String email);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser();
}
