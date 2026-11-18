package com.academy.service.email;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

/**
 * What one email says. Rendered by the single branded template
 * {@code templates/email/branded.html}, so every email shares the same design.
 *
 * Text values are escaped by Thymeleaf, except {@code paragraphs},
 * {@code afterParagraphs}, {@code notice} and {@code footNote}, which allow
 * simple inline HTML (bold, links). Anything user-provided that goes into those
 * must be passed through {@link #esc(String)} first.
 */
@Getter
public class EmailContent {

    public record Detail(String label, String value) {}

    private String subject;
    private String preheader;
    private String eyebrow;
    private String title;
    private String greeting = "Hello";
    private String name;
    private final List<String> paragraphs = new ArrayList<>();
    private final List<Detail> details = new ArrayList<>();
    private String notice;
    private String ctaLabel;
    private String ctaUrl;
    private final List<String> afterParagraphs = new ArrayList<>();
    private String linkHint = "If the button does not work, copy this link into your browser:";
    private String signOff = "See you soon,";
    private String footNote = "You receive this email because you have an account on Saralöwe Academy.";

    // Filled in by the sender.
    private String logoUrl;
    private String siteUrl;
    private int year;

    public static EmailContent of(String subject) {
        EmailContent c = new EmailContent();
        c.subject = subject;
        c.title = subject;
        return c;
    }

    public EmailContent preheader(String v) { this.preheader = v; return this; }
    public EmailContent eyebrow(String v) { this.eyebrow = v; return this; }
    public EmailContent title(String v) { this.title = v; return this; }
    public EmailContent to(String recipientName) { this.name = recipientName; return this; }
    public EmailContent paragraph(String html) { this.paragraphs.add(html); return this; }
    public EmailContent detail(String label, Object value) {
        if (value != null && !String.valueOf(value).isBlank()) this.details.add(new Detail(label, String.valueOf(value)));
        return this;
    }
    public EmailContent notice(String html) { this.notice = html; return this; }
    public EmailContent cta(String label, String url) { this.ctaLabel = label; this.ctaUrl = url; return this; }
    public EmailContent after(String html) { this.afterParagraphs.add(html); return this; }
    public EmailContent footNote(String html) { this.footNote = html; return this; }

    public EmailContent brand(String logoUrl, String siteUrl, int year) {
        this.logoUrl = logoUrl;
        this.siteUrl = siteUrl;
        this.year = year;
        if (this.preheader == null) this.preheader = this.title;
        return this;
    }

    /** HTML-escapes a value before it is placed inside an HTML-allowed field. */
    public static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length());
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case '<' -> b.append("&lt;");
                case '>' -> b.append("&gt;");
                case '&' -> b.append("&amp;");
                case '"' -> b.append("&quot;");
                case '\'' -> b.append("&#39;");
                default -> b.append(ch);
            }
        }
        return b.toString();
    }
}
