package com.academy.dto.response;

import com.academy.entity.ContactMessage;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactMessageResponse {

    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;

    public static ContactMessageResponse fromEntity(ContactMessage m) {
        return ContactMessageResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .email(m.getEmail())
                .phone(m.getPhone())
                .subject(m.getSubject())
                .message(m.getMessage())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
