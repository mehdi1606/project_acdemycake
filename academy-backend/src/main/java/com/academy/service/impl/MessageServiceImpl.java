package com.academy.service.impl;

import com.academy.dto.request.SendMessageRequest;
import com.academy.dto.response.ConversationResponse;
import com.academy.dto.response.MessageResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Message;
import com.academy.entity.User;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.MessageRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.MessageService;
import com.academy.service.NotificationService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<ConversationResponse> getConversations() {
        User currentUser = getCurrentUser();
        Set<User> partnerSet = new LinkedHashSet<>();
        partnerSet.addAll(messageRepository.findSenders(currentUser));
        partnerSet.addAll(messageRepository.findReceivers(currentUser));
        List<User> partners = new ArrayList<>(partnerSet);

        List<ConversationResponse> conversations = new ArrayList<>();
        for (User partner : partners) {
            Message lastMessage = messageRepository.findLastMessageBetween(currentUser, partner);
            long unreadCount = messageRepository.countUnreadMessagesFromUser(currentUser, partner);

            conversations.add(ConversationResponse.builder()
                    .participantId(partner.getId())
                    .participantName(partner.getFullName())
                    .participantAvatar(partner.getAvatarUrl())
                    .lastMessage(lastMessage != null ? truncateMessage(lastMessage.getContent()) : null)
                    .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                    .unreadCount((int) unreadCount)
                    .isOnline(false) // This would be tracked via WebSocket presence
                    .build());
        }

        // Sort by last message time
        conversations.sort((a, b) -> {
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });

        return conversations;
    }

    @Override
    public PageResponse<MessageResponse> getConversation(UUID userId, int page, int size) {
        User currentUser = getCurrentUser();
        User otherUser = userService.findById(userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagesPage = messageRepository.findConversation(currentUser, otherUser, pageable);

        return PageResponse.from(messagesPage, MessageResponse::fromEntity);
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        User currentUser = getCurrentUser();
        User receiver = userService.findById(request.getReceiverId());

        if (currentUser.getId().equals(receiver.getId())) {
            throw new BadRequestException("Cannot send message to yourself");
        }

        Message message = Message.builder()
                .sender(currentUser)
                .receiver(receiver)
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentType(request.getAttachmentType())
                .build();

        message = messageRepository.save(message);
        log.info("Message sent from {} to {}", currentUser.getEmail(), receiver.getEmail());

        MessageResponse response = MessageResponse.fromEntity(message);

        // Send real-time notification via WebSocket
        messagingTemplate.convertAndSendToUser(
                receiver.getId().toString(),
                "/queue/messages",
                response
        );

        // Send notification
        notificationService.sendMessageNotification(
                receiver,
                currentUser.getFullName(),
                truncateMessage(request.getContent())
        );

        return response;
    }

    @Override
    @Transactional
    public void markAsRead(UUID messageId) {
        User currentUser = getCurrentUser();
        Message message = findById(messageId);

        if (!message.getReceiver().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Cannot mark other user's messages as read");
        }

        if (!message.getIsRead()) {
            message.markAsRead();
            messageRepository.save(message);
        }
    }

    @Override
    @Transactional
    public void markConversationAsRead(UUID userId) {
        User currentUser = getCurrentUser();
        User sender = userService.findById(userId);

        messageRepository.markConversationAsRead(currentUser, sender);
        log.info("Marked conversation as read: {} from {}", currentUser.getEmail(), sender.getEmail());
    }

    @Override
    @Transactional
    public void deleteMessage(UUID messageId) {
        User currentUser = getCurrentUser();
        Message message = findById(messageId);

        if (message.getSender().getId().equals(currentUser.getId())) {
            message.setIsDeletedBySender(true);
        } else if (message.getReceiver().getId().equals(currentUser.getId())) {
            message.setIsDeletedByReceiver(true);
        } else {
            throw new ForbiddenException("Cannot delete other user's messages");
        }

        messageRepository.save(message);
        log.info("Message deleted: {} by user: {}", messageId, currentUser.getEmail());
    }

    @Override
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return messageRepository.countUnreadMessages(currentUser);
    }

    private Message findById(UUID id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", id));
    }

    private String truncateMessage(String content) {
        if (content == null) return null;
        return content.length() > 100 ? content.substring(0, 100) + "..." : content;
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
