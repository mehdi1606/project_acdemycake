package com.academy.security;

import com.academy.exception.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT authentication filter — runs once per request.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header.
 * 2. Validate the token, distinguishing EXPIRED from INVALID.
 *    - On token error: store a specific error code as a request attribute so
 *      {@link JwtAuthenticationEntryPoint} can return the right message.
 * 3. On valid token: load the user and set authentication in SecurityContext.
 * 4. Always continue the filter chain (let Spring Security deny access if needed).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = extractBearerToken(request);

        if (StringUtils.hasText(jwt)) {
            try {
                // Validate and parse — throws typed exceptions on failure
                if (tokenProvider.validateTokenStrict(jwt)) {
                    UUID userId = tokenProvider.getUserIdFromToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserById(userId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

            } catch (ExpiredJwtException ex) {
                log.warn("Expired JWT token for request [{}]", request.getRequestURI());
                request.setAttribute(JwtAuthenticationEntryPoint.JWT_ERROR_CODE_ATTR,
                        ErrorCode.TOKEN_EXPIRED.getCode());

            } catch (MalformedJwtException | UnsupportedJwtException | SignatureException ex) {
                log.warn("Invalid JWT token for request [{}]: {}", request.getRequestURI(), ex.getMessage());
                request.setAttribute(JwtAuthenticationEntryPoint.JWT_ERROR_CODE_ATTR,
                        ErrorCode.TOKEN_INVALID.getCode());

            } catch (UsernameNotFoundException ex) {
                log.warn("User not found for JWT token [{}]: {}", request.getRequestURI(), ex.getMessage());
                request.setAttribute(JwtAuthenticationEntryPoint.JWT_ERROR_CODE_ATTR,
                        ErrorCode.TOKEN_INVALID.getCode());

            } catch (IllegalArgumentException ex) {
                log.warn("JWT claims empty [{}]: {}", request.getRequestURI(), ex.getMessage());
                request.setAttribute(JwtAuthenticationEntryPoint.JWT_ERROR_CODE_ATTR,
                        ErrorCode.TOKEN_INVALID.getCode());

            } catch (Exception ex) {
                log.error("Unexpected JWT processing error [{}]: {}", request.getRequestURI(), ex.getMessage());
                request.setAttribute(JwtAuthenticationEntryPoint.JWT_ERROR_CODE_ATTR,
                        ErrorCode.TOKEN_INVALID.getCode());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
