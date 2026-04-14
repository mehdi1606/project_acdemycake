package com.academy.service.impl;

import com.academy.dto.response.NotificationResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.Notification;
import com.academy.entity.User;
import com.academy.entity.enums.NotificationType;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.NotificationRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.NotificationService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public PageResponse<NotificationResponse> getNotifications(int page, int size, NotificationType type) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> notificationsPage;
        if (type != null) {
            notificationsPage = notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(currentUser, type, pageable);
        } else {
            notificationsPage = notificationRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);
        }

        return PageResponse.from(notificationsPage, NotificationResponse::fromEntity);
    }

    @Override
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByUserAndIsReadFalse(currentUser);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = findById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Cannot mark other user's notifications");
        }

        if (!notification.getIsRead()) {
            notification.markAsRead();
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsReadByUser(currentUser);
        log.info("Marked all notifications as read for user: {}", currentUser.getEmail());
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = findById(notificationId);

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Cannot delete other user's notifications");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted: {} by user: {}", notificationId, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void createNotification(User user, String title, String message, NotificationType type, String linkUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .linkUrl(linkUrl)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification created for user: {} type: {}", user.getEmail(), type);

        // Send real-time notification via WebSocket
        sendWebSocketNotification(user, NotificationResponse.fromEntity(notification));
    }

    @Override
    @Async
    @Transactional
    public void sendCourseNotification(UUID courseId, String title, String message) {
        // Find all enrolled users for this course
        Course course = new Course();
        course.setId(courseId);

        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<CourseEnrollment> enrollments = enrollmentRepository.findByCourse(course, pageable);

        for (CourseEnrollment enrollment : enrollments) {
            if (enrollment.getIsActive()) {
                createNotification(
                        enrollment.getUser(),
                        title,
                        message,
                        NotificationType.COURSE,
                        "/courses/" + courseId
                );
            }
        }

        log.info("Sent course notification to {} enrolled users", enrollments.getTotalElements());
    }

    @Override
    @Transactional
    public void sendSubscriptionNotification(User user, String title, String message) {
        createNotification(
                user,
                title,
                message,
                NotificationType.SUBSCRIPTION,
                "/subscription"
        );
    }

    @Override
    @Transactional
    public void sendMessageNotification(User user, String senderName, String preview, UUID senderId) {
        createNotification(
                user,
                "New Message from " + senderName,
                preview,
                NotificationType.MESSAGE,
                "/messages?userId=" + senderId
        );
    }

    @Override
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(3);
        notificationRepository.deleteOldNotifications(cutoff);
        log.info("Cleaned up notifications older than {}", cutoff);
    }

    private Notification findById(UUID id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
    }

    private void sendWebSocketNotification(User user, NotificationResponse notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to user: {}", user.getId(), e);
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
