package com.academy.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.util.*;

/**
 * Announcement emails to every member (verified, not banned, not deleted).
 *
 * Gmail SMTP allows about 500 messages a day, and the platform's own emails
 * (sign-ups, password resets, payments) need some of that. So a launched
 * campaign is sent by a background job in small batches, never more than
 * {@code DAILY_CAP} campaign emails in any 24 hours, and it simply carries on
 * the next day until everyone has it. Every recipient is recorded, so nobody
 * gets the same campaign twice, even after a restart.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    public static final String UPDATE = "platform-update-2026-11";
    public static final String CHALLENGE = "challenge-open-2027";
    private static final int DAILY_CAP = 380;
    private static final int BATCH = 25;

    private final JdbcTemplate jdbc;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final ObjectMapper json;

    @Value("${app.email.from}") private String fromEmail;
    @Value("${app.email.from-name}") private String fromName;
    @Value("${app.frontend-url}") private String frontendUrl;
    @Value("${app.email.logo-url:}") private String logoUrl;

    // ── the two campaigns ───────────────────────────────────────────────────

    public record Feature(String icon, String title, String text) {}
    public record Side(String eyebrow, String title, String intro, List<Feature> features, String notice, String ctaLabel) {}
    public record Mail(String subject, String preheader, String ctaUrl, Side en, Side ar, String footEn, String footAr) {}

    private static final String FOOT_EN = "You receive this email because you have a SARALÖWE Academy account. You can turn off announcements in Settings › Notifications.";
    private static final String FOOT_AR = "تصلك هذه الرسالة لأن لديك حسابًا في أكاديمية SARALÖWE. يمكنك إيقاف الإعلانات من الإعدادات › الإشعارات.";

    public Mail mail(String key) {
        String site = site();
        return switch (key) {
            case UPDATE -> new Mail(
                    "SARALÖWE has been reimagined — come and see",
                    "A cinematic new home, Desktop & Mobile experiences, a luxury lesson player and our New Year Cake Challenge.",
                    site + "/",
                    new Side("The winter update", "Your atelier has been reimagined",
                            "We have spent the last weeks refining every corner of SARALÖWE Academy, so that learning feels as refined as the pastry we teach. Here is what is waiting for you.",
                            List.of(
                                    new Feature("✦", "A living home page", "Our home now opens with a hand-drawn world that grows before your eyes, dressed for winter until 7 January."),
                                    new Feature("◐", "Desktop or Mobile, your choice", "A cinematic experience for large screens, or a touch-first one designed for your phone. Each of your devices keeps its own."),
                                    new Feature("▶", "A luxury lesson player", "A new player in burgundy and gold: perfectly centred controls, larger buttons and smoother playback."),
                                    new Feature("◆", "Buy in one step", "No more cart: “Buy now” takes you straight to a secure checkout."),
                                    new Feature("❄", "Christmas at the academy", "Warm lights, gentle snow and a few festive touches across the platform."),
                                    new Feature("↯", "Faster everywhere", "Lighter pages and quicker loading, with the same SARALÖWE look on every screen.")),
                            "And something special: <strong>the New Year Cake Challenge</strong> is open until 25 December.",
                            "Discover the new SARALÖWE"),
                    new Side("تحديث الشتاء", "أعدنا تصميم أتيليه SARALÖWE",
                            "قضينا الأسابيع الماضية في صقل كل ركن من أكاديمية SARALÖWE، ليصبح التعلّم راقيًا كالحلويات التي نعلّمها. إليك ما ينتظرك.",
                            List.of(
                                    new Feature("✦", "صفحة رئيسية نابضة بالحياة", "تُفتتح صفحتنا الرئيسية الآن برسم يدوي ينمو أمام عينيك، بحلّة شتوية حتى 7 يناير."),
                                    new Feature("◐", "الحاسوب أو الهاتف، الاختيار لك", "تجربة سينمائية للشاشات الكبيرة، أو تجربة مصمّمة للّمس على هاتفك. لكل جهاز تجربته الخاصة."),
                                    new Feature("▶", "مشغّل دروس فاخر", "مشغّل جديد بالعنابي والذهبي: أزرار في المنتصف تمامًا، أكبر حجمًا، وتشغيل أكثر سلاسة."),
                                    new Feature("◆", "الشراء بخطوة واحدة", "لا سلة بعد الآن: زر «اشترِ الآن» يأخذك مباشرة إلى دفع آمن."),
                                    new Feature("❄", "عيد الميلاد في الأكاديمية", "أضواء دافئة وثلج خفيف ولمسات احتفالية في كل المنصة."),
                                    new Feature("↯", "أسرع في كل مكان", "صفحات أخفّ وتحميل أسرع، بنفس أناقة SARALÖWE على كل الشاشات.")),
                            "ومفاجأة خاصة: <strong>تحدّي كعكة رأس السنة</strong> مفتوح حتى 25 دجنبر.",
                            "اكتشف SARALÖWE الجديدة"),
                    FOOT_EN, FOOT_AR);
            case CHALLENGE -> new Mail(
                    "The New Year Cake Challenge is open ✦",
                    "One tier. One night of celebration. Entries until 25 December — the whole academy votes.",
                    site + "/challenge",
                    new Side("SARALÖWE Academy presents", "The New Year Cake Challenge 2027",
                            "One tier. One night of celebration. Show the academy how you welcome 2027, and let everyone vote for the most beautiful cake.",
                            List.of(
                                    new Feature("1", "Register", "Join from the challenge page before 25 December. It is free."),
                                    new Feature("2", "Create one tier", "Real or dummy, in any technique: fondant, buttercream, ganache, modelling, airbrush, painting…"),
                                    new Feature("3", "Photograph on white", "3 to 5 photos on a completely white background and surface, with one full front view."),
                                    new Feature("4", "Submit, then share", "Certify it is your own work. Once approved, share your cake: voting runs from 26 December to 1 January, winners on 5 January.")),
                            "A student vote counts <strong>1 point</strong>, an instructor or admin vote <strong>10 points</strong>. Every vote counts.",
                            "Enter the challenge"),
                    new Side("أكاديمية سارالوي تقدّم", "تحدّي كعكة رأس السنة 2027",
                            "طابق واحد. ليلة احتفال واحدة. أرِ الأكاديمية كيف تستقبل 2027، ودَع الجميع يصوّت لأجمل كعكة.",
                            List.of(
                                    new Feature("1", "سجّل", "انضمّ من صفحة التحدّي قبل 25 دجنبر. المشاركة مجانية."),
                                    new Feature("2", "اصنع طابقًا واحدًا", "كعكة حقيقية أو مجسّم، بأي تقنية: عجينة السكر، الكريمة، الغاناش، التشكيل، الإيربراش، الرسم…"),
                                    new Feature("3", "صوّر على الأبيض", "من 3 إلى 5 صور على خلفية وسطح أبيضين تمامًا، مع صورة أمامية كاملة."),
                                    new Feature("4", "أرسل ثم شارك", "أكّد أنه عملك. بعد الموافقة شارك كعكتك: التصويت من 26 دجنبر إلى 1 يناير، والفائزون يوم 5 يناير.")),
                            "صوت الطالب = <strong>نقطة واحدة</strong>، وصوت المدرّب أو الإدارة = <strong>10 نقاط</strong>. كل صوت مهم.",
                            "شارك في التحدّي"),
                    FOOT_EN, FOOT_AR);
            default -> throw new IllegalArgumentException("Unknown campaign");
        };
    }

    public String render(String key, String name) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("m", mail(key));
        ctx.setVariable("name", name == null || name.isBlank() ? null : name.trim().split("\\s+")[0]);
        ctx.setVariable("logo", (logoUrl == null || logoUrl.isBlank()) ? site() + "/assets/img/email/logo-gold.png" : logoUrl);
        ctx.setVariable("site", site());
        ctx.setVariable("year", LocalDate.now().getYear());
        return templateEngine.process("email/campaign", ctx);
    }

    // ── admin actions ───────────────────────────────────────────────────────

    public void sendTest(String key, String to, String name) {
        deliver(to, mail(key).subject() + " [test]", render(key, name));
    }

    public Map<String, Object> launch(String key) {
        mail(key); // unknown key -> error
        jdbc.update("UPDATE email_campaigns SET status = 'SENDING', launched_at = COALESCE(launched_at, now()), updated_at = now() WHERE key = ? AND status <> 'DONE'", key);
        return status(key);
    }

    public Map<String, Object> status(String key) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("key", key);
        s.put("status", jdbc.queryForObject("SELECT status FROM email_campaigns WHERE key = ?", String.class, key));
        s.put("audience", jdbc.queryForObject(
                "SELECT count(*) FROM users WHERE is_email_verified AND NOT is_deleted AND NOT is_banned", Long.class));
        for (String st : List.of("SENT", "FAILED", "SKIPPED")) {
            s.put(st.toLowerCase(Locale.ROOT), jdbc.queryForObject(
                    "SELECT count(*) FROM email_campaign_sends WHERE campaign = ? AND status = ?", Long.class, key, st));
        }
        s.put("sentLast24h", sentLast24h());
        s.put("dailyCap", DAILY_CAP);
        return s;
    }

    // ── the background sender ───────────────────────────────────────────────

    private volatile boolean running = false;

    @Scheduled(initialDelay = 60_000, fixedDelay = 120_000)
    public void tick() {
        if (running) return;
        running = true;
        try {
            List<String> active = jdbc.queryForList(
                    "SELECT key FROM email_campaigns WHERE status = 'SENDING' ORDER BY launched_at", String.class);
            for (String key : active) {
                long room = DAILY_CAP - sentLast24h();
                if (room <= 0) return; // carry on tomorrow
                List<Map<String, Object>> batch = jdbc.queryForList(
                        "SELECT u.id, u.email, u.full_name, u.notification_preferences FROM users u " +
                        "WHERE u.is_email_verified AND NOT u.is_deleted AND NOT u.is_banned " +
                        "AND NOT EXISTS (SELECT 1 FROM email_campaign_sends s WHERE s.campaign = ? AND s.user_id = u.id) " +
                        "ORDER BY u.created_at LIMIT ?", key, (int) Math.min(BATCH, room));
                if (batch.isEmpty()) {
                    jdbc.update("UPDATE email_campaigns SET status = 'DONE', finished_at = now(), updated_at = now() WHERE key = ?", key);
                    log.info("Campaign {} finished", key);
                    continue;
                }
                for (Map<String, Object> u : batch) {
                    UUID id = (UUID) u.get("id");
                    String status = "SENT";
                    String error = null;
                    if (!wants(key, (String) u.get("notification_preferences"))) {
                        status = "SKIPPED";
                    } else {
                        try {
                            deliver((String) u.get("email"), mail(key).subject(), render(key, (String) u.get("full_name")));
                            Thread.sleep(1200); // gentle on the SMTP server
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            return;
                        } catch (Exception e) {
                            status = "FAILED";
                            error = String.valueOf(e.getMessage());
                            error = error.substring(0, Math.min(error.length(), 290));
                        }
                    }
                    jdbc.update("INSERT INTO email_campaign_sends (campaign, user_id, status, error) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
                            key, id, status, error);
                }
                return; // one batch per tick keeps each run short
            }
        } catch (Exception e) {
            log.warn("Campaign sender: {}", e.getMessage());
        } finally {
            running = false;
        }
    }

    private long sentLast24h() {
        Long n = jdbc.queryForObject(
                "SELECT count(*) FROM email_campaign_sends WHERE status IN ('SENT','FAILED') AND created_at > now() - interval '24 hours'", Long.class);
        return n == null ? 0 : n;
    }

    /** Respect the member's notification settings (announcements / promotions switched off). */
    private boolean wants(String key, String prefsJson) {
        if (prefsJson == null || prefsJson.isBlank()) return true;
        try {
            JsonNode p = json.readTree(prefsJson);
            String field = UPDATE.equals(key) ? "systemUpdates" : "promotions";
            JsonNode v = p.get(field);
            return v == null || !v.isBoolean() || v.asBoolean();
        } catch (Exception e) {
            return true;
        }
    }

    private void deliver(String to, String subject, String html) {
        if (to == null || to.isBlank()) throw new IllegalArgumentException("No email address");
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    private String site() {
        return frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
    }
}
