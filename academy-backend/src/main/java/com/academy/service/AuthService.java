package com.academy.service;

import com.academy.dto.request.*;
import com.academy.dto.response.AuthResponse;
import com.academy.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);
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
