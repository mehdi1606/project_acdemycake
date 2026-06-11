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
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Translates dynamic DB content between Arabic and English using a self-hosted
 * LibreTranslate instance, with a two-level cache (in-memory + DB) so each unique
 * text is translated only once. Being self-hosted, there is no per-day quota.
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

    /** Base URL of the self-hosted LibreTranslate service (trailing slash optional). */
    @Value("${app.translation.libretranslate-url:http://localhost:5000}")
    private String libreUrl;

    /** Optional LibreTranslate API key — only if your instance enforces one. */
    @Value("${app.translation.api-key:}")
    private String apiKey;

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
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("q", text);
        body.put("source", source);
        body.put("target", target);
        body.put("format", "text");
        if (apiKey != null && !apiKey.isBlank()) body.put("api_key", apiKey);

        String endpoint = libreUrl.replaceAll("/+$", "") + "/translate";
        HttpRequest req = HttpRequest.newBuilder(URI.create(endpoint))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200)
            throw new RuntimeException("LibreTranslate HTTP " + resp.statusCode() + ": " + resp.body());
        JsonNode node = json.readTree(resp.body()).path("translatedText");
        if (node.isMissingNode() || node.asText().isBlank())
            throw new RuntimeException("LibreTranslate empty response: " + resp.body());
        return node.asText();
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
