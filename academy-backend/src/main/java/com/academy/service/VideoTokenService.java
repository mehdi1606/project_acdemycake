package com.academy.service;

import java.util.Optional;
import java.util.UUID;

/**
 * Issues and validates short-lived tokens that authorise streaming access
 * to a specific lesson video.
 * <p>
 * Tokens are scoped to a (lessonId, userId) pair and expire after a short TTL.
 * The streaming endpoint resolves the associated user and revalidates course
 * access on every request.
 */
public interface VideoTokenService {

    /**
     * Validated token context associating a streaming token with a lesson and user.
     */
    record ValidatedToken(UUID lessonId, UUID userId) {}

    /**
     * Generate a new cryptographically secure token for the given lesson and user.
     *
     * @param lessonId the lesson UUID
     * @param userId   the authenticated user UUID (may be null for anonymous preview if ever enabled)
     * @return an opaque, URL-safe token string
     */
    String generateToken(UUID lessonId, UUID userId);

    /**
     * Returns {@code true} if the token is valid, unexpired, and
     * bound to {@code lessonId}.
     */
    boolean validateToken(String token, UUID lessonId);

    /**
     * Validates the token against {@code lessonId} and returns the associated
     * {@link ValidatedToken} (containing {@code lessonId} and {@code userId})
     * so the caller can revalidate live user and subscription authorization.
     */
    Optional<ValidatedToken> validateAndResolve(String token, UUID lessonId);
}
