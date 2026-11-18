package com.academy.service;

import com.academy.entity.User;
import com.academy.service.email.PendingPaymentInfo;

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

    /** Confirms an ebook purchase; the book is read inside the platform. */
    void sendEbookPurchaseConfirmation(User user, String ebookTitle, String ebookSlug);

    /**
     * Reminder for a payment started but never finished.
     * @param reminderNumber 1, 2 or 3 — the 3rd warns that it will be cancelled.
     */
    void sendPaymentReminder(User user, PendingPaymentInfo info, int reminderNumber);

    /** Tells the customer their unfinished payment was cancelled automatically. */
    void sendPaymentCancelled(User user, PendingPaymentInfo info);

    /** Tells an instructor whether the admin published or sent back their course (with the reason). */
    void sendCourseReviewResult(User instructor, String courseTitle, String courseSlug, boolean approved, String reason);
}
