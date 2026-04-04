package com.academy.service;

import com.academy.entity.User;

public interface EmailService {

    void sendWelcomeEmail(User user);

    void sendVerificationEmail(User user, String token);

    void sendPasswordResetEmail(User user, String token);

    void sendSubscriptionConfirmation(User user);

    void sendSubscriptionExpiryReminder(User user, int daysLeft);

    void sendSubscriptionExpired(User user);

    void sendCoursePurchaseConfirmation(User user, String courseTitle);

    void sendCoursePurchaseConfirmation(User user, com.academy.entity.Course course);

    void sendCourseEnrollmentConfirmation(User user, String courseTitle);

    void sendNewLessonNotification(User user, String courseTitle, String lessonTitle);

    void sendCertificateEarned(User user, String courseTitle, String downloadUrl);

    void sendPostReplyNotification(User user, String postTitle, String replierName);

    void sendNewMessageNotification(User user, String senderName);

    void sendGenericEmail(String to, String subject, String templateName, Object context);

    void sendAccountCreatedEmail(User user, String temporaryPassword);
}
