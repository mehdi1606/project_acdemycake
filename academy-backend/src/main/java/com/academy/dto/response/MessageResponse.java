package com.academy.dto.response;

import com.academy.entity.Message;
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
public class MessageResponse {
    private UUID id;
    private UUID senderId;
    private String senderName;
    private String senderAvatar;
    private UUID receiverId;
    private String receiverName;
    private String receiverAvatar;
    private String content;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String attachmentUrl;
    private String attachmentType;
    private LocalDateTime createdAt;

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderAvatar(message.getSender().getAvatarUrl())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getFullName())
                .receiverAvatar(message.getReceiver().getAvatarUrl())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .attachmentUrl(message.getAttachmentUrl())
                .attachmentType(message.getAttachmentType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
