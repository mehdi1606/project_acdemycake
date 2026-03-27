package com.academy.service;

import com.academy.dto.request.SendMessageRequest;
import com.academy.dto.response.ConversationResponse;
import com.academy.dto.response.MessageResponse;
import com.academy.dto.response.PageResponse;

import java.util.List;
import java.util.UUID;

public interface MessageService {

    List<ConversationResponse> getConversations();

    PageResponse<MessageResponse> getConversation(UUID userId, int page, int size);

    MessageResponse sendMessage(SendMessageRequest request);

    void markAsRead(UUID messageId);

    void markConversationAsRead(UUID userId);

    void deleteMessage(UUID messageId);

    long getUnreadCount();
}
