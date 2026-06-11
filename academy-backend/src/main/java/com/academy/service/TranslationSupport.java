package com.academy.service;

import org.springframework.stereotype.Component;

/**
 * Bridges the Spring-managed {@link TranslationService} to the static response
 * mappers (CourseResponse.fromEntity, etc.) so they can localise text fields to
 * the current request language without changing every call site.
 */
@Component
public class TranslationSupport {

    private static TranslationService service;

    public TranslationSupport(TranslationService translationService) {
        TranslationSupport.service = translationService;
    }

    /** Localise to the current request's language; safe no-op if the context isn't ready. */
    public static String localize(String text) {
        return service != null ? service.localizeCurrent(text) : text;
    }
}
