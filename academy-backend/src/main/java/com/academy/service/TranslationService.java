package com.academy.service;

import com.academy.entity.ContentTranslation;
import com.academy.repository.ContentTranslationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Translates dynamic DB content between Arabic and English using the free MyMemory
 * API, with a two-level cache (in-memory + DB) so each unique text is translated
 * only once — keeping us comfortably inside the free daily quota.
 *
 * Reads are NON-BLOCKING: a cache hit returns instantly; a miss returns the original
 * text immediately and schedules the translation in the background, so the next view
 * is translated. Call {@link #prewarm} at create/edit time to translate proactively.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationService {

    private final ContentTranslationRepository repository;

    /** Optional — your email raises MyMemory's free limit from ~5k to ~50k words/day. */
    @Value("${app.translation.email:}")
    private String contactEmail;

    private static final String MYMEMORY = "https://api.mymemory.translated.net/get";
    private static final int    MAX_CHUNK = 480;   // MyMemory free q limit (~500 bytes)

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6)).build();
    private final ObjectMapper json = new ObjectMapper();
    private final Map<String, String> memCache = new ConcurrentHashMap<>();
    private final ExecutorService pool = Executors.newFixedThreadPool(2);

    // ── Public API ──────────────────────────────────────────────────────────────

    /** Localise text to the current request's language (from the Accept-Language header). */
    public String localizeCurrent(String text) {
        Locale locale = LocaleContextHolder.getLocale();
        return localize(text, locale != null ? locale.getLanguage() : "en");
    }

    /** Localise text to {@code targetLang} ("ar"/"en"). Non-blocking; see class doc. */
    public String localize(String text, String targetLang) {
        if (text == null || text.isBlank() || targetLang == null) return text;

        String target = targetLang.toLowerCase(Locale.ROOT).startsWith("ar") ? "ar" : "en";
        String source = containsArabic(text) ? "ar" : "en";
        if (source.equals(target)) return text;          // already in the wanted language

        String hash   = sha256(text);
        String memKey = hash + ':' + target;

        String cached = memCache.get(memKey);
        if (cached != null) return cached;

        try {
            var row = repository.findByTextHashAndTargetLang(hash, target);
            if (row.isPresent()) {
                memCache.put(memKey, row.get().getTranslated());
                return row.get().getTranslated();
            }
        } catch (Exception e) {
            log.debug("translation cache lookup failed: {}", e.getMessage());
        }

        // Miss → translate in the background; return the original for now.
        pool.submit(() -> translateAndStore(text, hash, source, target));
        return text;
    }

    /** Proactively translate both directions at create/edit time so reads are instant. */
    public void prewarm(String text) {
        if (text == null || text.isBlank()) return;
        localize(text, "ar");
        localize(text, "en");
    }

    // ── Internals ───────────────────────────────────────────────────────────────

    private void translateAndStore(String text, String hash, String source, String target) {
        try {
            String translated = translateViaApi(text, source, target);
            if (translated == null || translated.isBlank() || translated.equals(text)) return;
            memCache.put(hash + ':' + target, translated);
            try {
                repository.save(ContentTranslation.builder()
                        .textHash(hash).targetLang(target).sourceLang(source)
                        .translated(translated).build());
            } catch (Exception duplicate) {
                // Concurrent insert for the same key — fine, it's already cached.
            }
        } catch (Exception e) {
            log.warn("MyMemory translation failed ({}→{}): {}", source, target, e.getMessage());
        }
    }

    private String translateViaApi(String text, String source, String target) throws Exception {
        StringBuilder out = new StringBuilder();
        for (String chunk : splitChunks(text)) {
            String url = MYMEMORY + "?q=" + URLEncoder.encode(chunk, StandardCharsets.UTF_8)
                    + "&langpair=" + source + "|" + target
                    + (contactEmail != null && !contactEmail.isBlank()
                       ? "&de=" + URLEncoder.encode(contactEmail, StandardCharsets.UTF_8) : "");
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8)).GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) throw new RuntimeException("HTTP " + resp.statusCode());
            JsonNode node = json.readTree(resp.body()).path("responseData").path("translatedText");
            if (node.isMissingNode() || node.asText().isBlank()) throw new RuntimeException("empty response");
            if (out.length() > 0) out.append(' ');
            out.append(node.asText());
        }
        return out.toString();
    }

    /** Split long text into ≤MAX_CHUNK pieces on sentence/word boundaries. */
    private List<String> splitChunks(String text) {
        List<String> chunks = new ArrayList<>();
        if (text.length() <= MAX_CHUNK) { chunks.add(text); return chunks; }
        String[] words = text.split(" ");
        StringBuilder cur = new StringBuilder();
        for (String w : words) {
            if (cur.length() + w.length() + 1 > MAX_CHUNK && cur.length() > 0) {
                chunks.add(cur.toString()); cur.setLength(0);
            }
            if (cur.length() > 0) cur.append(' ');
            cur.append(w);
        }
        if (cur.length() > 0) chunks.add(cur.toString());
        return chunks;
    }

    private static boolean containsArabic(String text) {
        return text.codePoints().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }

    private static String sha256(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(text.hashCode());
        }
    }
}
