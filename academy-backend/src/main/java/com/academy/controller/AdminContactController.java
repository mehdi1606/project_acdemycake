package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.ContactMessageResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.ContactMessage;
import com.academy.repository.ContactMessageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/contact-messages")
@RequiredArgsConstructor
@Tag(name = "Admin Contact Messages", description = "Admin endpoints for managing contact form submissions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContactController {

    private final ContactMessageRepository contactMessageRepository;

    @GetMapping
    @Operation(summary = "Get all contact messages (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<ContactMessageResponse>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    Boolean unreadOnly) {

        PageRequest pageable = PageRequest.of(page, size);
        Page<ContactMessageResponse> result;

        if (Boolean.TRUE.equals(unreadOnly)) {
            result = contactMessageRepository
                    .findByIsReadOrderByCreatedAtDesc(false, pageable)
                    .map(ContactMessageResponse::fromEntity);
        } else {
            result = contactMessageRepository
                    .findAllByOrderByCreatedAtDesc(pageable)
                    .map(ContactMessageResponse::fromEntity);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get contact message stats (unread count)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        long unread = contactMessageRepository.countByIsRead(false);
        long total  = contactMessageRepository.count();
        return ResponseEntity.ok(ApiResponse.success(Map.of("total", total, "unread", unread)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a contact message as read")
    public ResponseEntity<ApiResponse<ContactMessageResponse>> markRead(@PathVariable UUID id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        msg.setRead(true);
        contactMessageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", ContactMessageResponse.fromEntity(msg)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a contact message")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted"));
    }
}
