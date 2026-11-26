package com.academy.service.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/**
 * Pure invoice arithmetic and formatting, kept free of Spring so it is easy to test.
 *
 * Stored prices are what the customer paid, tax included (TTC). With a VAT rate
 * above 0 the net (HT) is computed back from the paid total and rounded to
 * 2 decimals; the VAT is the remainder, so HT + TVA always equals the amount paid.
 */
public final class InvoiceMath {

    public static final String PREFIX = "SL";

    private InvoiceMath() {}

    /** HT / TVA / TTC breakdown of an amount paid tax included. */
    public record VatBreakdown(BigDecimal rate, BigDecimal ht, BigDecimal vat, BigDecimal ttc) {
        public boolean hasVat() { return rate.signum() > 0; }
    }

    public static VatBreakdown fromPaidTotal(BigDecimal paidTotal, BigDecimal vatRatePercent) {
        BigDecimal ttc = (paidTotal == null ? BigDecimal.ZERO : paidTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal rate = normaliseRate(vatRatePercent);
        if (rate.signum() == 0) {
            return new VatBreakdown(rate, ttc, BigDecimal.ZERO.setScale(2), ttc);
        }
        BigDecimal divisor = BigDecimal.ONE.add(rate.movePointLeft(2));
        BigDecimal ht = ttc.divide(divisor, 2, RoundingMode.HALF_UP);
        BigDecimal vat = ttc.subtract(ht);
        return new VatBreakdown(rate, ht, vat, ttc);
    }

    /** A VAT percentage between 0 and 100 with 2 decimals; anything else counts as 0. */
    public static BigDecimal normaliseRate(BigDecimal rate) {
        if (rate == null || rate.signum() <= 0 || rate.compareTo(BigDecimal.valueOf(100)) >= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return rate.setScale(2, RoundingMode.HALF_UP);
    }

    /** Parses a configured rate such as "20", "20.0" or "20,5"; blank or invalid gives 0. */
    public static BigDecimal parseRate(String configured) {
        if (configured == null || configured.isBlank()) return BigDecimal.ZERO.setScale(2);
        try {
            return normaliseRate(new BigDecimal(configured.replace("%", "").replace(',', '.').trim()));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO.setScale(2);
        }
    }

    /** SL-2026-000001 */
    public static String formatNumber(int year, int sequence) {
        return String.format(Locale.ROOT, "%s-%04d-%06d", PREFIX, year, sequence);
    }

    /** French money format: 1 234,50 MAD */
    public static String money(BigDecimal amount, String currency) {
        DecimalFormatSymbols s = new DecimalFormatSymbols(Locale.FRANCE);
        s.setGroupingSeparator(' ');
        s.setDecimalSeparator(',');
        DecimalFormat f = new DecimalFormat("#,##0.00", s);
        String v = f.format(amount == null ? BigDecimal.ZERO : amount);
        return currency == null || currency.isBlank() ? v : v + " " + currency;
    }

    /** "20 %" or "5,5 %" */
    public static String percent(BigDecimal rate) {
        BigDecimal r = normaliseRate(rate).stripTrailingZeros();
        if (r.scale() < 0) r = r.setScale(0);
        return r.toPlainString().replace('.', ',') + " %";
    }

    /** True when the text holds Arabic letters (the PDF fonts cannot shape them). */
    public static boolean hasArabic(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); ) {
            int cp = s.codePointAt(i);
            Character.UnicodeBlock b = Character.UnicodeBlock.of(cp);
            if (b == Character.UnicodeBlock.ARABIC || b == Character.UnicodeBlock.ARABIC_SUPPLEMENT
                    || b == Character.UnicodeBlock.ARABIC_EXTENDED_A
                    || b == Character.UnicodeBlock.ARABIC_PRESENTATION_FORMS_A
                    || b == Character.UnicodeBlock.ARABIC_PRESENTATION_FORMS_B) {
                return true;
            }
            i += Character.charCount(cp);
        }
        return false;
    }
}
