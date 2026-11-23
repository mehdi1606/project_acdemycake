package com.academy.service.impl;

import com.academy.service.VideoTokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token store backed by a {@link ConcurrentHashMap}.
 * <p>
 * Works for single-instance deployments. For multi-instance
 * setups, swap the in-memory map for a Redis key-value store.
 * <p>
 * Token TTL: 30 minutes (short-lived; transparently renewed by the client
 * during long viewing sessions). Expired entries are purged periodically via
 * {@link #evictExpiredTokens()}.
 */
@Slf4j
@Service
public class VideoTokenServiceImpl implements VideoTokenService {

    /** Short-lived streaming token TTL: 30 minutes. */
    public static final long TOKEN_TTL_MS = 30L * 60 * 1000;

    private static final int TOKEN_BYTE_LENGTH = 32; // 256-bit cryptographic entropy

    private final SecureRandom secureRandom = new SecureRandom();

    private record TokenEntry(UUID lessonId, UUID userId, Instant expiresAt) {}

    private final Map<String, TokenEntry> store = new ConcurrentHashMap<>();

    // ── API ──────────────────────────────────────────────────────────────────

    @Override
    public String generateToken(UUID lessonId, UUID userId) {
        if (lessonId == null) {
            throw new IllegalArgumentException("lessonId is required");
        }
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        Instant expiresAt = Instant.now().plusMillis(TOKEN_TTL_MS);
        store.put(token, new TokenEntry(lessonId, userId, expiresAt));
        log.debug("Video streaming token generated for lesson {}", lessonId);
        return token;
    }

    @Override
    public boolean validateToken(String token, UUID lessonId) {
        return validateAndResolve(token, lessonId).isPresent();
    }

    @Override
    public Optional<ValidatedToken> validateAndResolve(String token, UUID lessonId) {
        if (token == null || token.isBlank() || lessonId == null) {
            return Optional.empty();
        }
        TokenEntry entry = store.get(token);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(token);
            return Optional.empty();
        }
        if (!entry.lessonId().equals(lessonId)) {
            return Optional.empty();
        }
        return Optional.of(new ValidatedToken(entry.lessonId(), entry.userId()));
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────

    /** Remove expired tokens every 15 minutes to prevent memory growth. */
    @Scheduled(fixedDelay = 900_000)
    public void evictExpiredTokens() {
        Instant now     = Instant.now();
        int[]   removed = {0};
        store.entrySet().removeIf(e -> {
            if (now.isAfter(e.getValue().expiresAt())) { removed[0]++; return true; }
            return false;
        });
        if (removed[0] > 0) log.debug("Evicted {} expired video tokens", removed[0]);
    }
}
