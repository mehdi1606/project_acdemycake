package com.academy.service.impl;

import com.academy.service.VideoTokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token store backed by a {@link ConcurrentHashMap}.
 * <p>
 * Works perfectly for single-instance deployments.  For multi-instance
 * setups, swap the in-memory map for a Redis key-value store.
 * <p>
 * Token TTL: 2 hours.  Expired entries are purged once per hour via the
 * {@link #evictExpiredTokens()} scheduler.
 */
@Slf4j
@Service
public class VideoTokenServiceImpl implements VideoTokenService {

    private static final long TOKEN_TTL_MS = 2L * 60 * 60 * 1000; // 2 hours

    private record TokenEntry(UUID lessonId, UUID userId, Instant expiresAt) {}

    private final Map<String, TokenEntry> store = new ConcurrentHashMap<>();

    // ── API ──────────────────────────────────────────────────────────────────

    @Override
    public String generateToken(UUID lessonId, UUID userId) {
        String  token     = UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plusMillis(TOKEN_TTL_MS);
        store.put(token, new TokenEntry(lessonId, userId, expiresAt));
        log.debug("Video token generated for lesson {}", lessonId);
        return token;
    }

    @Override
    public boolean validateToken(String token, UUID lessonId) {
        if (token == null || token.isBlank()) return false;
        TokenEntry entry = store.get(token);
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(token);
            return false;
        }
        return entry.lessonId().equals(lessonId);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────

    /** Remove expired tokens once per hour to prevent memory growth. */
    @Scheduled(fixedDelay = 3_600_000)
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
