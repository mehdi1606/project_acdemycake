package com.academy.controller;

import com.academy.dto.request.SendMessageRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.ConversationResponse;
import com.academy.dto.response.MessageResponse;
import com.academy.dto.response.PageResponse;
import com.academy.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Direct messaging endpoints")
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/conversations")
    @Operation(summary = "Get all conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations() {
        List<ConversationResponse> response = messageService.getConversations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations/{userId}")
    @Operation(summary = "Get conversation with a specific user")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getConversation(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<MessageResponse> response = messageService.getConversation(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/send")
    @Operation(summary = "Send a message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Message sent", response));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        messageService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read"));
    }

    @PutMapping("/conversations/{userId}/read")
    @Operation(summary = "Mark all messages in conversation as read")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(@PathVariable UUID userId) {
        messageService.markConversationAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as read"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a message")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable UUID id) {
        messageService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted"));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long count = messageService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
