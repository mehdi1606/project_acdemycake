package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.MessageResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.User;
import com.academy.repository.MessageRepository;
import com.academy.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin oversight of member messaging (SecurityConfig: /api/v1/admin/** = ADMIN only).
 * Read-only: every conversation between two people, including messages either side deleted.
 */
@RestController
@RequestMapping("/api/v1/admin/messages")
@RequiredArgsConstructor
@Tag(name = "Admin messages", description = "Read every member conversation (admin only)")
public class AdminMessageController {

    private final NamedParameterJdbcTemplate jdbc;
    private final MessageRepository messageRepository;
    private final UserService userService;

    @GetMapping("/conversations")
    @Operation(summary = "All conversations (pairs of people), newest first; search by name or email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> conversations(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        int pageSize = Math.max(1, Math.min(100, size));
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("limit", pageSize)
                .addValue("offset", Math.max(0, page) * pageSize);
        String filter = "";
        if (search != null && !search.isBlank()) {
            p.addValue("q", "%" + search.trim().toLowerCase() + "%");
            filter = " WHERE lower(ua.full_name) LIKE :q OR lower(ua.email) LIKE :q OR lower(ub.full_name) LIKE :q OR lower(ub.email) LIKE :q";
        }
        String pairs = """
                WITH pairs AS (
                  SELECT LEAST(sender_id, receiver_id) AS a, GREATEST(sender_id, receiver_id) AS b,
                         COUNT(*) AS total, MAX(created_at) AS last_at
                  FROM messages GROUP BY 1, 2
                )
                SELECT p.a, p.b, p.total, p.last_at,
                       ua.full_name AS a_name, ua.avatar_url AS a_avatar, ua.role AS a_role,
                       ub.full_name AS b_name, ub.avatar_url AS b_avatar, ub.role AS b_role,
                       (SELECT m.content FROM messages m
                         WHERE LEAST(m.sender_id, m.receiver_id) = p.a AND GREATEST(m.sender_id, m.receiver_id) = p.b
                         ORDER BY m.created_at DESC LIMIT 1) AS last_message
                FROM pairs p JOIN users ua ON ua.id = p.a JOIN users ub ON ub.id = p.b
                """ + filter;
        List<Map<String, Object>> rows = jdbc.query(pairs + " ORDER BY p.last_at DESC LIMIT :limit OFFSET :offset", p, (rs, i) -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("userA", person(rs.getObject("a", UUID.class), rs.getString("a_name"), rs.getString("a_avatar"), rs.getString("a_role")));
            r.put("userB", person(rs.getObject("b", UUID.class), rs.getString("b_name"), rs.getString("b_avatar"), rs.getString("b_role")));
            r.put("messages", rs.getLong("total"));
            Timestamp last = rs.getTimestamp("last_at");
            r.put("lastMessageAt", last == null ? null : last.toLocalDateTime());
            String content = rs.getString("last_message");
            r.put("lastMessage", content == null ? "" : (content.length() > 120 ? content.substring(0, 120) + "…" : content));
            return r;
        });
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM (" + pairs + ") x", p, Long.class);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", rows);
        body.put("totalElements", total == null ? 0 : total);
        body.put("page", page);
        body.put("size", pageSize);
        return ResponseEntity.ok(ApiResponse.success(body));
    }

    @GetMapping("/conversation")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Messages between two people, newest first")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> conversation(
            @RequestParam UUID a, @RequestParam UUID b,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        User ua = userService.findById(a);
        User ub = userService.findById(b);
        var msgs = messageRepository.findAllBetweenForAdmin(ua, ub, PageRequest.of(Math.max(0, page), Math.max(1, Math.min(200, size))));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(msgs, MessageResponse::fromEntity)));
    }

    private static Map<String, Object> person(UUID id, String name, String avatar, String role) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("avatarUrl", avatar);
        m.put("role", role);
        return m;
    }
}
