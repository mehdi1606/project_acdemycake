package com.academy.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/refresh-token"
    );

    // 10 requests per minute per IP for rate-limited auth endpoints
    private static final int CAPACITY = 10;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    // Bounded and self-cleaning: an attacker rotating IPs can't grow memory forever.
    private final com.github.benmanes.caffeine.cache.Cache<String, Bucket> buckets =
            com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
                    .maximumSize(100_000)
                    .expireAfterAccess(Duration.ofMinutes(10))
                    .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!RATE_LIMITED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = getClientKey(request);
        Bucket bucket = buckets.get(clientKey, k -> newBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many requests. Please try again later.\",\"data\":null}"
            );
        }
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.classic(CAPACITY, Refill.greedy(CAPACITY, REFILL_PERIOD));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientKey(HttpServletRequest request) {
        return clientIp(request) + ":" + request.getRequestURI();
    }

    /**
     * The real client IP. Forwarding headers are client-controlled, so they are
     * only trusted when the request comes from our own reverse proxy (nginx on
     * the same host / private network), which sets X-Real-IP to the real address.
     * A direct request uses its socket address — a spoofed header can no longer
     * give an attacker a fresh rate-limit bucket on every request.
     */
    static String clientIp(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (isTrustedProxy(remote)) {
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) return realIp.trim();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String[] hops = forwarded.split(",");
                return hops[hops.length - 1].trim(); // the hop our proxy appended
            }
        }
        return remote;
    }

    private static boolean isTrustedProxy(String ip) {
        try {
            java.net.InetAddress a = java.net.InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }
}
