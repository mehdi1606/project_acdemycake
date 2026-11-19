package com.academy.service;

import com.academy.entity.AppSetting;
import com.academy.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Dynamic, admin-editable platform settings backed by the {@code app_settings} table.
 *
 * Subscription prices are read from here so the admin can change them live (no
 * redeploy). If a row is missing the value falls back to the application.yml
 * default, so the platform behaves correctly even before the seed migration runs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    public static final String KEY_MONTHLY_PRICE = "subscription.monthly_price";
    public static final String KEY_YEARLY_PRICE  = "subscription.yearly_price";
    /** Academy WhatsApp number used to reserve a place on a LIVE masterclass. */
    public static final String KEY_MASTERCLASS_WHATSAPP = "masterclass.whatsapp_number";

    /**
     * Limited-time offer on the Annual plan (Black Friday, Christmas...): its price and its
     * window (ISO dates with offset, e.g. 2026-11-20T00:00:00+01:00). Only inside the
     * window is the offer price charged; before and after, renewals included, the normal
     * yearly price applies. Decided by the server clock, never the visitor's device.
     */
    public static final String KEY_PROMO_ID        = "promo.id";
    public static final String KEY_PROMO_THEME     = "promo.theme";
    public static final String KEY_PROMO_PRICE     = "promo.yearly_price";
    public static final String KEY_PROMO_STARTS_AT = "promo.starts_at";
    public static final String KEY_PROMO_ENDS_AT   = "promo.ends_at";

    public record YearlyPromo(String id, String theme, BigDecimal price, OffsetDateTime startsAt, OffsetDateTime endsAt) {
        public boolean isActive(OffsetDateTime now) { return !now.isBefore(startsAt) && now.isBefore(endsAt); }
        public boolean isOver(OffsetDateTime now)   { return !now.isBefore(endsAt); }
    }

    private final AppSettingRepository repository;

    // application.yml defaults — used only when the DB row is absent/invalid.
    @Value("${app.subscription.monthly-price}") private BigDecimal defaultMonthlyPrice;
    @Value("${app.subscription.yearly-price}")  private BigDecimal defaultYearlyPrice;
    @Value("${app.subscription.currency}")      private String     currency;

    // ── Reads ─────────────────────────────────────────────────────────────────

    public BigDecimal getMonthlyPrice() {
        return getDecimal(KEY_MONTHLY_PRICE, defaultMonthlyPrice);
    }

    public BigDecimal getYearlyPrice() {
        return getDecimal(KEY_YEARLY_PRICE, defaultYearlyPrice);
    }

    /** The configured offer (past, running or upcoming), if its settings are complete and valid. */
    public Optional<YearlyPromo> getYearlyPromo() {
        try {
            String id = get(KEY_PROMO_ID), theme = get(KEY_PROMO_THEME), price = get(KEY_PROMO_PRICE),
                   start = get(KEY_PROMO_STARTS_AT), end = get(KEY_PROMO_ENDS_AT);
            if (id == null || price == null || start == null || end == null) return Optional.empty();
            YearlyPromo p = new YearlyPromo(id, theme == null ? "blackfriday" : theme, new BigDecimal(price.trim()),
                    OffsetDateTime.parse(start.trim()), OffsetDateTime.parse(end.trim()));
            if (p.price().signum() <= 0 || !p.endsAt().isAfter(p.startsAt())) return Optional.empty();
            return Optional.of(p);
        } catch (Exception e) {
            log.warn("Offer settings are invalid, ignoring them: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** The offer running right now, if any. */
    public Optional<YearlyPromo> getActiveYearlyPromo() {
        OffsetDateTime now = OffsetDateTime.now();
        return getYearlyPromo().filter(p -> p.isActive(now));
    }

    /** What the Annual plan costs right now: the offer price inside its window, else the normal price. */
    public BigDecimal getEffectiveYearlyPrice() {
        return getActiveYearlyPromo().map(YearlyPromo::price).orElseGet(this::getYearlyPrice);
    }

    public String getCurrency() {
        return currency;
    }

    /**
     * Digits-only WhatsApp number (country code included), or "" when the admin
     * has not configured one yet. Callers must treat blank as "not available"
     * rather than sending students to an invalid chat.
     */
    public String getMasterclassWhatsappNumber() {
        return repository.findById(KEY_MASTERCLASS_WHATSAPP)
                .map(s -> s.getValue() == null ? "" : s.getValue().replaceAll("[^0-9]", ""))
                .orElse("");
    }

    // ── Writes ────────────────────────────────────────────────────────────────

    @Transactional
    public void updateSubscriptionPricing(BigDecimal monthlyPrice, BigDecimal yearlyPrice) {
        if (monthlyPrice != null) upsert(KEY_MONTHLY_PRICE, monthlyPrice.toPlainString());
        if (yearlyPrice  != null) upsert(KEY_YEARLY_PRICE,  yearlyPrice.toPlainString());
        log.info("Subscription pricing updated → monthly={} yearly={}", monthlyPrice, yearlyPrice);
    }

    /** Store the academy WhatsApp number; non-digits are stripped so wa.me links always work. */
    @Transactional
    public void updateMasterclassWhatsappNumber(String number) {
        String digits = number == null ? "" : number.replaceAll("[^0-9]", "");
        upsert(KEY_MASTERCLASS_WHATSAPP, digits);
        log.info("Masterclass WhatsApp number updated (length={})", digits.length());
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private String get(String key) {
        return repository.findById(key).map(AppSetting::getValue).filter(v -> !v.isBlank()).orElse(null);
    }

    private BigDecimal getDecimal(String key, BigDecimal fallback) {
        return repository.findById(key)
                .map(s -> {
                    try {
                        return new BigDecimal(s.getValue().trim());
                    } catch (NumberFormatException e) {
                        log.warn("Setting '{}' has a non-numeric value '{}', using default {}", key, s.getValue(), fallback);
                        return fallback;
                    }
                })
                .orElse(fallback);
    }

    private void upsert(String key, String value) {
        AppSetting setting = repository.findById(key)
                .orElseGet(() -> AppSetting.builder().key(key).build());
        setting.setValue(value);
        repository.save(setting);
    }
}
