package com.academy.security;

import com.academy.dto.response.ApiResponse;
import com.academy.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Handles 403 Forbidden errors that occur at the Spring Security filter level
 * (before the request reaches a controller or @ExceptionHandler).
 *
 * Triggered when an authenticated user tries to access a resource they are
 * not permitted to access (wrong role, etc.).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        log.warn("Access denied [{}] — principal: {}",
                request.getRequestURI(),
                request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "unknown");

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        ApiResponse<Void> body = ApiResponse
                .<Void>error("You do not have permission to perform this action.", ErrorCode.FORBIDDEN.getCode())
                .withPath(request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
