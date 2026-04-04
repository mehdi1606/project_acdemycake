package com.academy.security;

import com.academy.dto.response.ApiResponse;
import com.academy.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Handles 401 Unauthorized errors that occur at the Spring Security filter
 * level — before the request reaches any controller or @ExceptionHandler.
 *
 * Triggered by:
 * - Missing / expired / invalid JWT on a protected endpoint
 * - Wrong credentials on the login endpoint
 * - Anonymous user accessing an authenticated-only resource
 *
 * Reads the token-specific error code stored by {@link JwtAuthenticationFilter}
 * as a request attribute to return TOKEN_EXPIRED vs TOKEN_INVALID.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    /** Request attribute key set by JwtAuthenticationFilter. */
    public static final String JWT_ERROR_CODE_ATTR = "jwt_error_code";

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        log.warn("Unauthorized [{}]: {}", request.getRequestURI(), authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String message;
        String errorCode;

        // 1. Check if JwtAuthenticationFilter stored a token-specific code
        String jwtAttr = (String) request.getAttribute(JWT_ERROR_CODE_ATTR);
        if (ErrorCode.TOKEN_EXPIRED.getCode().equals(jwtAttr)) {
            message   = "Your session has expired. Please log in again.";
            errorCode = ErrorCode.TOKEN_EXPIRED.getCode();

        } else if (ErrorCode.TOKEN_INVALID.getCode().equals(jwtAttr)) {
            message   = "Invalid authentication token. Please log in again.";
            errorCode = ErrorCode.TOKEN_INVALID.getCode();

        // 2. Classify by exception type
        } else if (authException instanceof BadCredentialsException) {
            message   = "Invalid email or password.";
            errorCode = ErrorCode.INVALID_CREDENTIALS.getCode();

        } else if (authException instanceof DisabledException) {
            message   = "Your account has been disabled. Please contact support.";
            errorCode = ErrorCode.ACCOUNT_DISABLED.getCode();

        } else if (authException instanceof LockedException) {
            message   = "Your account has been temporarily locked. Please try again later.";
            errorCode = ErrorCode.ACCOUNT_LOCKED.getCode();

        } else if (authException instanceof InsufficientAuthenticationException) {
            message   = "You must be logged in to access this resource.";
            errorCode = ErrorCode.INSUFFICIENT_AUTHENTICATION.getCode();

        } else {
            message   = "Authentication failed. Please log in again.";
            errorCode = ErrorCode.UNAUTHORIZED.getCode();
        }

        ApiResponse<Void> body = ApiResponse
                .<Void>error(message, errorCode)
                .withPath(request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
