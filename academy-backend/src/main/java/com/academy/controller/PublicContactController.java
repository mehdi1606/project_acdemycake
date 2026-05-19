package com.academy.controller;

import com.academy.dto.request.ContactMessageRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.entity.ContactMessage;
import com.academy.repository.ContactMessageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/contact")
@RequiredArgsConstructor
@Tag(name = "Public Contact", description = "Public contact form submission — no authentication required")
public class PublicContactController {

    private final ContactMessageRepository contactMessageRepository;

    @PostMapping
    @Operation(summary = "Submit a contact message")
    public ResponseEntity<ApiResponse<Void>> submit(
            @Valid @RequestBody ContactMessageRequest request) {

        ContactMessage msg = ContactMessage.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .subject(request.getSubject())
                .message(request.getMessage())
                .isRead(false)
                .build();

        contactMessageRepository.save(msg);

        return ResponseEntity.ok(ApiResponse.success("Message sent successfully. We will get back to you soon."));
    }
}
