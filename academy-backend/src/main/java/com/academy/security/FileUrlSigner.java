package com.academy.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Short-lived signed links for protected files served by /files/**.
 *
 * Paid lesson resources live under {@code lesson-resources/}. They are opened by
 * plain URLs (img/video tags, the PDF viewer, Google Docs viewer), so a login
 * header cannot be required. Instead the API only hands out links — to users who
 * passed the course access check — that carry an expiry and an HMAC signature;
 * FileController refuses protected paths without a valid one.
 */
@Component
public class FileUrlSigner {

    /**
     * Folders under the upload dir that need a signed link:
     * paid lesson files, raw uploaded videos (played only through the token-gated
     * streaming endpoint) and students' assignment submissions.
     */
    public static final String[] PROTECTED_PREFIXES = { "lesson-resources/", "videos/", "assignment-submissions/" };

    /** How long a link stays valid (long enough for a video resource). */
    private static final long TTL_SECONDS = 12 * 60 * 60;

    private static final Pattern RESOURCE_REF = Pattern.compile(
            "lesson-resources/[A-Za-z0-9._-]+?\\.[A-Za-z0-9]+(?:\\?exp=\\d+(?:&|&amp;)sig=[A-Za-z0-9_-]+)?");

    private final byte[] key;

    public FileUrlSigner(@Value("${app.jwt.secret}") String secret) {
        // Domain-separate from JWT signing so a file signature is never a valid JWT input.
        this.key = ("file-links:" + secret).getBytes(StandardCharsets.UTF_8);
    }

    public static boolean isProtected(String relativePath) {
        if (relativePath == null) return false;
        for (String p : PROTECTED_PREFIXES) {
            if (relativePath.startsWith(p)) return true;
        }
        return false;
    }

    /** "lesson-resources/x.pdf" → "lesson-resources/x.pdf?exp=…&sig=…". Unprotected paths are returned unchanged. */
    public String sign(String relativePath) {
        if (relativePath == null) return null;
        String path = stripQuery(relativePath);
        if (!isProtected(path)) return relativePath;
        long exp = Instant.now().getEpochSecond() + TTL_SECONDS;
        return path + "?exp=" + exp + "&sig=" + hmac(path + "|" + exp);
    }

    /**
     * Signs a full or relative file URL ("https://host/files/assignment-submissions/x.pdf"
     * or "assignment-submissions/x.pdf"). Other URLs are returned unchanged.
     */
    public String signUrl(String url) {
        if (url == null) return null;
        int i = url.indexOf("/files/");
        if (i < 0) return sign(url);
        return url.substring(0, i + "/files/".length()) + sign(url.substring(i + "/files/".length()));
    }

    /** Removes a link signature (before storing a URL). */
    public static String unsignUrl(String url) {
        return url == null ? null : stripQuery(url);
    }

    /** Re-signs every protected file reference inside lesson HTML (e.g. embedded PDFs). */
    public String signReferencesIn(String html) {
        if (html == null || html.isEmpty()) return html;
        Matcher m = RESOURCE_REF.matcher(html);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            String signed = sign(stripQuery(m.group())).replace("&", "&amp;");
            m.appendReplacement(out, Matcher.quoteReplacement(signed));
        }
        m.appendTail(out);
        return out.toString();
    }

    /** Removes link signatures before content is stored, so stale ones never get saved. */
    public String stripReferencesIn(String html) {
        if (html == null || html.isEmpty()) return html;
        Matcher m = RESOURCE_REF.matcher(html);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(out, Matcher.quoteReplacement(stripQuery(m.group())));
        }
        m.appendTail(out);
        return out.toString();
    }

    public boolean isValid(String relativePath, String exp, String sig) {
        if (exp == null || sig == null) return false;
        long expiry;
        try {
            expiry = Long.parseLong(exp);
        } catch (NumberFormatException e) {
            return false;
        }
        if (expiry < Instant.now().getEpochSecond()) return false;
        byte[] expected = hmac(relativePath + "|" + expiry).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, sig.getBytes(StandardCharsets.UTF_8));
    }

    private static String stripQuery(String path) {
        int q = path.indexOf('?');
        return q >= 0 ? path.substring(0, q) : path;
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign file link", e);
        }
    }
}
