package com.academy.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    private static final Map<String, String> onlineUsers = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = headerAccessor.getUser();

        if (user != null) {
            String sessionId = headerAccessor.getSessionId();
            onlineUsers.put(sessionId, user.getName());
            log.info("User connected: {} - Session: {}", user.getName(), sessionId);

            messagingTemplate.convertAndSend("/topic/presence",
                    Map.of("user", user.getName(), "status", "online"));
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String username = onlineUsers.remove(sessionId);

        if (username != null) {
            log.info("User disconnected: {} - Session: {}", username, sessionId);

            messagingTemplate.convertAndSend("/topic/presence",
                    Map.of("user", username, "status", "offline"));
        }
    }

    public boolean isUserOnline(String username) {
        return onlineUsers.containsValue(username);
    }
}
