package com.academy.service;

import java.util.UUID;

/**
 * Issues and validates short-lived tokens that authorise streaming access
 * to a specific lesson video.
 * <p>
 * Tokens are scoped to a (lessonId, userId) pair and expire after 2 hours.
 * The streaming endpoint calls {@link #validateToken} on every request;
 * no Spring Security principal is required on that public route.
 */
public interface VideoTokenService {

    /**
     * Generate a new token for the given lesson and user.
     *
     * @return an opaque, URL-safe token string
     */
    String generateToken(UUID lessonId, UUID userId);

    /**
     * Returns {@code true} if the token is valid, unexpired, and
     * bound to {@code lessonId}.
     */
    boolean validateToken(String token, UUID lessonId);
}
