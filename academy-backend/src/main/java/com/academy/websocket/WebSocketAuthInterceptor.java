package com.academy.websocket;

import com.academy.security.CustomUserDetailsService;
import com.academy.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            UsernamePasswordAuthenticationToken authentication = null;

            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (tokenProvider.validateToken(token)) {
                        UUID userId = tokenProvider.getUserIdFromToken(token);
                        UserDetails userDetails = userDetailsService.loadUserById(userId);
                        if (userDetails.isEnabled() && userDetails.isAccountNonLocked()) {
                            authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                        }
                    }
                } catch (Exception e) {
                    log.warn("WebSocket authentication failed: {}", e.getMessage());
                }
            }

            // Anonymous / invalid / banned connections are refused outright.
            if (authentication == null) {
                throw new MessagingException("Unauthorized WebSocket connection");
            }
            SecurityContextHolder.getContext().setAuthentication(authentication);
            accessor.setUser(authentication);
            log.info("WebSocket authenticated for user: {}", authentication.getName());
            return message;
        }

        // Clients may only SEND to application endpoints (/app/**), never straight to
        // broker topics or queues (that would let anyone forge presence / messages).
        if (StompCommand.SEND.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            if (dest == null || !dest.startsWith("/app/")) {
                throw new MessagingException("Sending to " + dest + " is not allowed");
            }
        }

        return message;
    }
}
