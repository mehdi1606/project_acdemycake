package com.academy.dto.response;

import com.academy.entity.TicketMessage;
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
public class TicketMessageResponse {

    private UUID id;
    private String senderName;
    private String senderAvatar;

    /**
     * Using Boolean wrapper (not primitive boolean) so Lombok generates
     * getIsAdminReply() instead of isAdminReply(). Jackson then serialises
     * the property as "isAdminReply" (preserving the "is" prefix) instead
     * of "adminReply" which would happen with a primitive boolean getter.
     */
    @JsonProperty("isAdminReply")
    private Boolean isAdminReply;

    private String content;
    private LocalDateTime createdAt;

    public static TicketMessageResponse fromEntity(TicketMessage msg) {
        return TicketMessageResponse.builder()
                .id(msg.getId())
                .senderName(msg.getSender().getFullName())
                .senderAvatar(msg.getSender().getAvatarUrl())
                .isAdminReply(Boolean.TRUE.equals(msg.getIsAdminReply()))
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
