package com.academy.service;

import com.academy.entity.AppSetting;
import com.academy.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

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
