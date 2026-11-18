package com.academy.service.impl;

import com.academy.entity.Course;
import com.academy.entity.User;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.MasterclassFormat;
import com.academy.service.EmailService;
import com.academy.service.email.EmailContent;
import com.academy.service.email.PendingPaymentInfo;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

import static com.academy.service.email.EmailContent.esc;

/**
 * Every platform email, all rendered with the one branded template
 * ({@code templates/email/branded.html}): Saralöwe logo, burgundy / gold / ivory.
 * Links point at real frontend routes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** PNG (not SVG: Gmail and Outlook block SVG images). */
    @Value("${app.email.logo-url:}")
    private String logoUrl;

    private String site() {
        return frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    private String url(String path) {
        return site() + path;
    }

    // ── Account ──────────────────────────────────────────────────────────────

    @Override
    @Async
    public void sendVerificationEmail(User user, String token) {
        send(user.getEmail(), EmailContent.of("Confirm your email address")
                .eyebrow("Welcome")
                .title("Confirm your email address")
                .preheader("One click and your Saralöwe Academy account is ready.")
                .to(user.getFullName())
                .paragraph("Thank you for joining <strong>Saralöwe Academy</strong>, the home of couture cake design.")
                .paragraph("Please confirm your email address to activate your account.")
                .cta("Confirm my email", url("/verify-email?token=" + enc(token)))
                .after("This link is valid for 24 hours. If you did not create an account, you can ignore this email."));
    }

    @Override
    @Async
    public void sendWelcomeEmail(User user) {
        send(user.getEmail(), EmailContent.of("Welcome to Saralöwe Academy")
                .eyebrow("Your account is active")
                .title("Welcome to Saralöwe Academy")
                .preheader("Courses, masterclasses and ebooks are waiting for you.")
                .to(user.getFullName())
                .paragraph("Your email is confirmed and your account is ready.")
                .paragraph("Discover our online courses, our live and recorded masterclasses and our exclusive recipe ebooks — all crafted to take your cake design to the next level.")
                .cta("Start exploring", url("/login"))
                .after("Need help? Simply reply to this email or write to us from the <a href=\"" + url("/pages/contact-us") + "\" style=\"color:#C5912C;\">contact page</a>."));
    }

    @Override
    @Async
    public void sendPasswordResetEmail(User user, String token) {
        send(user.getEmail(), EmailContent.of("Reset your password")
                .eyebrow("Security")
                .title("Reset your password")
                .preheader("Choose a new password for your Saralöwe Academy account.")
                .to(user.getFullName())
                .paragraph("We received a request to reset the password of your account.")
                .cta("Choose a new password", url("/reset-password?token=" + enc(token)))
                .after("This link is valid for 1 hour. If you did not ask for this, ignore this email — your password stays the same."));
    }

    @Override
    @Async
    public void sendAccountCreatedEmail(User user, String temporaryPassword) {
        send(user.getEmail(), EmailContent.of("Your Saralöwe Academy account")
                .eyebrow("Account created")
                .title("Your account is ready")
                .to(user.getFullName())
                .paragraph("An administrator has created an account for you on <strong>Saralöwe Academy</strong>.")
                .detail("Email", user.getEmail())
                .detail("Temporary password", temporaryPassword)
                .detail("Role", prettyRole(user))
                .notice("For your security, please change this password right after your first login.")
                .cta("Sign in", url("/login")));
    }

    // ── Subscription ─────────────────────────────────────────────────────────

    @Override
    @Async
    public void sendSubscriptionConfirmation(User user) {
        EmailContent c = EmailContent.of("Your Premium membership is active")
                .eyebrow("Payment confirmed")
                .title("Welcome to Premium")
                .preheader("Your Premium membership is now active.")
                .to(user.getFullName())
                .paragraph("Thank you! Your payment was received and your <strong>Premium membership</strong> is now active.")
                .paragraph("You have full access to all the academy courses, certificates and the community.");
        if (user.getSubscriptionEndDate() != null) {
            c.detail("Active until", user.getSubscriptionEndDate().toLocalDate().format(DATE));
        }
        send(user.getEmail(), c.cta("Go to my courses", url("/student/student-courses")));
    }

    @Override
    @Async
    public void sendSubscriptionExpiryReminder(User user, int daysLeft) {
        String when = daysLeft <= 1 ? "tomorrow" : "in " + daysLeft + " days";
        send(user.getEmail(), EmailContent.of("Your Premium membership ends " + when)
                .eyebrow("Reminder")
                .title("Your membership ends " + when)
                .to(user.getFullName())
                .paragraph("Your Premium membership ends <strong>" + when + "</strong>. Renew now to keep access to all your courses without interruption.")
                .cta("Renew my membership", url("/pages/pricing-plan")));
    }

    @Override
    @Async
    public void sendSubscriptionExpired(User user) {
        send(user.getEmail(), EmailContent.of("Your Premium membership has ended")
                .eyebrow("Membership ended")
                .title("We miss you already")
                .to(user.getFullName())
                .paragraph("Your Premium membership has ended, so the subscription courses are no longer available.")
                .paragraph("Your progress and certificates are kept — renew at any time and pick up exactly where you left off.")
                .cta("Renew my membership", url("/pages/pricing-plan")));
    }

    // ── Courses & masterclasses ──────────────────────────────────────────────

    @Override
    @Async
    public void sendCoursePurchaseConfirmation(User user, String courseTitle) {
        send(user.getEmail(), EmailContent.of("Your purchase is confirmed")
                .eyebrow("Payment confirmed")
                .title("Your course is ready")
                .to(user.getFullName())
                .paragraph("Thank you for your purchase. You now have access to <strong>" + esc(courseTitle) + "</strong>.")
                .cta("Go to my courses", url("/student/student-courses")));
    }

    @Override
    @Async
    public void sendCoursePurchaseConfirmation(User user, Course course) {
        boolean masterclass = course.getCourseType() == CourseType.MASTERCLASS;
        boolean live = masterclass && course.getMasterclassFormat() == MasterclassFormat.LIVE;
        String courseUrl = url("/course/course-details/" + course.getSlug());

        EmailContent c = EmailContent.of(live ? "Your place is confirmed: " + course.getTitle()
                        : "Your purchase is confirmed: " + course.getTitle())
                .eyebrow("Payment confirmed")
                .title(live ? "Your place is confirmed" : masterclass ? "Your masterclass is ready" : "Your course is ready")
                .to(user.getFullName())
                .paragraph(live
                        ? "Thank you! Your payment was received and your place in <strong>" + esc(course.getTitle()) + "</strong> is reserved."
                        : "Thank you for your purchase. You now have lifetime access to <strong>" + esc(course.getTitle()) + "</strong>.");
        if (live) {
            if (course.getSessionDate() != null) c.detail("Date", course.getSessionDate().format(DATE));
            if (course.getSessionStartTime() != null) {
                c.detail("Time", course.getSessionStartTime()
                        + (course.getSessionEndTime() != null ? " – " + course.getSessionEndTime() : ""));
            }
            c.detail("Location", course.getSessionLocation());
            c.after("We look forward to welcoming you. The instructor may contact you on WhatsApp with practical details.");
        }
        send(user.getEmail(), c.cta(live ? "See the masterclass" : "Start learning", live ? courseUrl : url("/student/student-courses")));
    }

    @Override
    @Async
    public void sendCourseEnrollmentConfirmation(User user, String courseTitle) {
        send(user.getEmail(), EmailContent.of("You're enrolled: " + courseTitle)
                .eyebrow("Enrollment confirmed")
                .title("You're enrolled")
                .to(user.getFullName())
                .paragraph("You are now enrolled in <strong>" + esc(courseTitle) + "</strong>. Enjoy the lessons!")
                .cta("Go to my courses", url("/student/student-courses")));
    }

    @Override
    @Async
    public void sendNewLessonNotification(User user, String courseTitle, String lessonTitle) {
        send(user.getEmail(), EmailContent.of("New lesson: " + lessonTitle)
                .eyebrow("New lesson")
                .title(lessonTitle)
                .to(user.getFullName())
                .paragraph("A new lesson has just been added to <strong>" + esc(courseTitle) + "</strong>.")
                .cta("Watch the lesson", url("/student/student-courses")));
    }

    @Override
    @Async
    public void sendCertificateEarned(User user, String courseTitle, String downloadUrl) {
        send(user.getEmail(), EmailContent.of("Congratulations — your certificate is ready")
                .eyebrow("Certificate earned")
                .title("Congratulations!")
                .to(user.getFullName())
                .paragraph("You completed <strong>" + esc(courseTitle) + "</strong> and earned your Saralöwe Academy certificate.")
                .cta("See my certificates", url("/student/student-certificates")));
    }

    @Override
    @Async
    public void sendCourseReviewResult(User instructor, String courseTitle, String courseSlug, boolean approved, String reason) {
        if (approved) {
            send(instructor.getEmail(), EmailContent.of("Your course is live: " + courseTitle)
                    .eyebrow("Course approved")
                    .title("Your course is published")
                    .to(instructor.getFullName())
                    .paragraph("Great news! <strong>" + esc(courseTitle) + "</strong> was approved and is now visible to students.")
                    .cta("See my course", url("/course/course-details/" + courseSlug)));
        } else {
            EmailContent c = EmailContent.of("Changes requested: " + courseTitle)
                    .eyebrow("Course review")
                    .title("Your course needs a few changes")
                    .to(instructor.getFullName())
                    .paragraph("Thank you for submitting <strong>" + esc(courseTitle) + "</strong>. Before it can be published, the review team asks for some changes.");
            if (reason != null && !reason.isBlank()) c.notice("<strong>Reviewer's note:</strong> " + esc(reason));
            send(instructor.getEmail(), c
                    .paragraph("Your course is back in draft. Make the changes, then submit it again for review.")
                    .cta("Edit my course", url("/instructor/instructor-course")));
        }
    }

    // ── Community & messages ─────────────────────────────────────────────────

    @Override
    @Async
    public void sendPostReplyNotification(User user, String postTitle, String replierName) {
        send(user.getEmail(), EmailContent.of(replierName + " replied to your post")
                .eyebrow("Community")
                .title("New reply to your post")
                .to(user.getFullName())
                .paragraph("<strong>" + esc(replierName) + "</strong> replied to “" + esc(postTitle) + "”.")
                .cta("Read the reply", url("/community")));
    }

    @Override
    @Async
    public void sendNewMessageNotification(User user, String senderName) {
        send(user.getEmail(), EmailContent.of("New message from " + senderName)
                .eyebrow("Messages")
                .title("You have a new message")
                .to(user.getFullName())
                .paragraph("<strong>" + esc(senderName) + "</strong> sent you a message.")
                .cta("Open my messages", url("/student/student-messages")));
    }

    // ── Ebooks ───────────────────────────────────────────────────────────────

    @Override
    @Async
    public void sendEbookPurchaseConfirmation(User user, String ebookTitle, String ebookSlug) {
        send(user.getEmail(), EmailContent.of("Your ebook is ready: " + ebookTitle)
                .eyebrow("Payment confirmed")
                .title("Your ebook is ready")
                .preheader(ebookTitle + " is now in your library.")
                .to(user.getFullName())
                .paragraph("Thank you for your purchase! <strong>" + esc(ebookTitle) + "</strong> has been added to your library.")
                .paragraph("Your ebook is read online, inside your Saralöwe Academy account, on any device.")
                .cta("Read my ebook", url("/student/student-ebooks")));
    }

    // ── Unfinished payments ──────────────────────────────────────────────────

    @Override
    @Async
    public void sendPaymentReminder(User user, PendingPaymentInfo info, int reminderNumber) {
        String item = describe(info);
        EmailContent c;
        if (reminderNumber <= 1) {
            c = EmailContent.of("Your order is waiting: " + info.itemTitle())
                    .eyebrow("Order not completed")
                    .title("Did something go wrong?")
                    .preheader("Your payment for " + info.itemTitle() + " was not completed.")
                    .to(user.getFullName())
                    .paragraph("You started a payment for " + item + ", but it was not completed.")
                    .paragraph("If you had a problem with the card page, you can simply try again — it only takes a minute.");
        } else if (reminderNumber == 2) {
            c = EmailContent.of("Still interested in " + info.itemTitle() + "?")
                    .eyebrow("Reminder")
                    .title("Your order is still waiting")
                    .to(user.getFullName())
                    .paragraph("Your payment for " + item + " is still not completed.")
                    .paragraph("Need help with the payment? Reply to this email and our team will help you.");
        } else {
            c = EmailContent.of("Last reminder: your order will be cancelled")
                    .eyebrow("Last reminder")
                    .title("Your order will be cancelled")
                    .to(user.getFullName())
                    .paragraph("This is our last reminder about your unfinished payment for " + item + ".")
                    .notice("Without a payment, this order will be <strong>cancelled automatically within 24 hours</strong>.");
        }
        c.detail("Order", info.orderId())
                .detail("Amount", money(info.amount(), info.currency()))
                .cta("Complete my purchase", info.payAgainUrl())
                .after("If you no longer want this order, you can simply ignore this email. If your card was charged, please contact us and we will sort it out right away.")
                .footNote("You receive this email because you started a payment on Saralöwe Academy. We send at most 3 reminders per order.");
        send(user.getEmail(), c);
    }

    @Override
    @Async
    public void sendPaymentCancelled(User user, PendingPaymentInfo info) {
        send(user.getEmail(), EmailContent.of("Your unfinished order was cancelled")
                .eyebrow("Order cancelled")
                .title("Your order was cancelled")
                .to(user.getFullName())
                .paragraph("Your payment for " + describe(info) + " was never completed, so the order has been cancelled automatically.")
                .detail("Order", info.orderId())
                .detail("Amount", money(info.amount(), info.currency()))
                .paragraph("You can place a new order at any time. If your card was charged for this order, please contact us and we will sort it out right away.")
                .cta("Order again", info.payAgainUrl()));
    }

    // ── Legacy entry point (no current callers) ──────────────────────────────

    @Override
    @Async
    public void sendGenericEmail(String to, String subject, String templateName, Object context) {
        EmailContent c = EmailContent.of(subject);
        if (context instanceof Map<?, ?> map) {
            Object name = map.get("name");
            if (name != null) c.to(String.valueOf(name));
            Object message = map.get("message");
            if (message != null) c.paragraph(esc(String.valueOf(message)));
            Object url = map.get("url");
            if (url != null) {
                Object label = map.get("urlLabel");
                c.cta(label != null ? String.valueOf(label) : "Open", String.valueOf(url));
            }
        }
        send(to, c);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String describe(PendingPaymentInfo info) {
        String kind = info.kind() == null ? "" : info.kind();
        return switch (kind) {
            case "subscription" -> "the <strong>" + esc(info.itemTitle()) + "</strong>";
            case "ebook" -> "the ebook <strong>" + esc(info.itemTitle()) + "</strong>";
            case "masterclass" -> "the masterclass <strong>" + esc(info.itemTitle()) + "</strong>";
            case "course" -> "the course <strong>" + esc(info.itemTitle()) + "</strong>";
            default -> "<strong>" + esc(info.itemTitle()) + "</strong>";
        };
    }

    private static String money(BigDecimal amount, String currency) {
        if (amount == null) return null;
        return amount.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString()
                + " " + (currency == null ? "MAD" : currency);
    }

    private static String prettyRole(User user) {
        if (user.getRole() == null) return null;
        String r = user.getRole().name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(r.charAt(0)) + r.substring(1);
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }

    private void send(String to, EmailContent content) {
        if (to == null || to.isBlank()) return;
        try {
            String logo = (logoUrl == null || logoUrl.isBlank()) ? url("/assets/img/email/logo-gold.png") : logoUrl;
            content.brand(logo, site(), LocalDate.now().getYear());

            Context ctx = new Context(Locale.ENGLISH);
            ctx.setVariable("c", content);
            String html = templateEngine.process("email/branded", ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(content.getSubject());
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email sent to {} - {}", to, content.getSubject());
        } catch (Exception e) {
            log.error("Failed to send email to {} - {}: {}", to, content.getSubject(), e.getMessage());
        }
    }
}
