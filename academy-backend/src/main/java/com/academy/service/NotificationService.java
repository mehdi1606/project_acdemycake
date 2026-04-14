package com.academy.service;

import com.academy.dto.response.NotificationResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.User;
import com.academy.entity.enums.NotificationType;

import java.util.UUID;

public interface NotificationService {

    PageResponse<NotificationResponse> getNotifications(int page, int size, NotificationType type);

    long getUnreadCount();

    void markAsRead(UUID notificationId);

    void markAllAsRead();

    void deleteNotification(UUID notificationId);

    void createNotification(User user, String title, String message, NotificationType type, String linkUrl);

    void sendCourseNotification(UUID courseId, String title, String message);

    void sendSubscriptionNotification(User user, String title, String message);

    void sendMessageNotification(User user, String senderName, String preview, UUID senderId);

    void cleanupOldNotifications();
}
