package com.academy.service.impl;

import com.academy.entity.User;
import com.academy.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Async
    public void sendWelcomeEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("loginUrl", frontendUrl + "/login");

        sendTemplatedEmail(user.getEmail(), "Welcome to Cake Design Academy!", "welcome", variables);
    }

    @Override
    @Async
    public void sendVerificationEmail(User user, String token) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("verificationUrl", frontendUrl + "/verify-email?token=" + token);

        sendTemplatedEmail(user.getEmail(), "Verify Your Email", "verification", variables);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(User user, String token) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("resetUrl", frontendUrl + "/reset-password?token=" + token);

        sendTemplatedEmail(user.getEmail(), "Reset Your Password", "password-reset", variables);
    }

    @Override
    @Async
    public void sendSubscriptionConfirmation(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("expiryDate", user.getSubscriptionEndDate().toLocalDate().toString());
        variables.put("coursesUrl", frontendUrl + "/courses/beginner");

        sendTemplatedEmail(user.getEmail(), "Subscription Confirmed!", "subscription-confirmation", variables);
    }

    @Override
    @Async
    public void sendSubscriptionExpiryReminder(User user, int daysLeft) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("daysLeft", daysLeft);
        variables.put("renewUrl", frontendUrl + "/subscription/renew");

        sendTemplatedEmail(user.getEmail(), "Your Subscription Expires Soon", "subscription-expiry-reminder", variables);
    }

    @Override
    @Async
    public void sendSubscriptionExpired(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("renewUrl", frontendUrl + "/subscription");

        sendTemplatedEmail(user.getEmail(), "Your Subscription Has Expired", "subscription-expired", variables);
    }

    @Override
    @Async
    public void sendCoursePurchaseConfirmation(User user, String courseTitle) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("courseTitle", courseTitle);
        variables.put("myCoursesUrl", frontendUrl + "/my-courses");

        sendTemplatedEmail(user.getEmail(), "Course Purchase Confirmed!", "course-purchase", variables);
    }

    @Override
    @Async
    public void sendCoursePurchaseConfirmation(User user, com.academy.entity.Course course) {
        sendCoursePurchaseConfirmation(user, course.getTitle());
    }

    @Override
    @Async
    public void sendCourseEnrollmentConfirmation(User user, String courseTitle) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("courseTitle", courseTitle);
        variables.put("myCoursesUrl", frontendUrl + "/my-courses");

        sendTemplatedEmail(user.getEmail(), "You're Enrolled!", "course-enrollment", variables);
    }

    @Override
    @Async
    public void sendNewLessonNotification(User user, String courseTitle, String lessonTitle) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("courseTitle", courseTitle);
        variables.put("lessonTitle", lessonTitle);

        sendTemplatedEmail(user.getEmail(), "New Lesson Available: " + lessonTitle, "new-lesson", variables);
    }

    @Override
    @Async
    public void sendCertificateEarned(User user, String courseTitle, String downloadUrl) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("courseTitle", courseTitle);
        variables.put("downloadUrl", downloadUrl);
        variables.put("certificatesUrl", frontendUrl + "/certificates");

        sendTemplatedEmail(user.getEmail(), "Congratulations! Certificate Earned", "certificate-earned", variables);
    }

    @Override
    @Async
    public void sendPostReplyNotification(User user, String postTitle, String replierName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("postTitle", postTitle);
        variables.put("replierName", replierName);
        variables.put("communityUrl", frontendUrl + "/community");

        sendTemplatedEmail(user.getEmail(), replierName + " replied to your post", "post-reply", variables);
    }

    @Override
    @Async
    public void sendNewMessageNotification(User user, String senderName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("senderName", senderName);
        variables.put("messagesUrl", frontendUrl + "/messages");

        sendTemplatedEmail(user.getEmail(), "New message from " + senderName, "new-message", variables);
    }

    @Override
    @Async
    public void sendAccountCreatedEmail(User user, String temporaryPassword) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getFullName());
        variables.put("email", user.getEmail());
        variables.put("password", temporaryPassword);
        variables.put("role", user.getRole().name());
        variables.put("loginUrl", frontendUrl + "/login");

        sendTemplatedEmail(user.getEmail(), "Your Cake Design Academy Account", "account-created", variables);
    }

    @Override
    @Async
    public void sendGenericEmail(String to, String subject, String templateName, Object context) {
        if (context instanceof Map) {
            sendTemplatedEmail(to, subject, templateName, (Map<String, Object>) context);
        }
    }

    private void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);

            String htmlContent = templateEngine.process("email/" + templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {} - Subject: {}", to, subject);

        } catch (MessagingException e) {
            log.error("Failed to send email to: {} - Error: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to: {} - Error: {}", to, e.getMessage());
        }
    }
}
