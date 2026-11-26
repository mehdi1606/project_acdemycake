package com.academy.config;

import com.academy.service.invoice.InvoiceMath;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Seller details and VAT rate printed on invoices (app.invoice.*, backed by the
 * INVOICE_* environment variables). Empty values are simply not printed.
 */
@Getter
@Component
public class InvoiceSettings {

    public static final String DEFAULT_SELLER_NAME = "SARALÖWE Academy";

    private final String sellerName;
    private final String sellerAddress;
    private final String sellerIce;
    private final String sellerIf;
    private final String sellerRc;
    private final String sellerEmail;
    private final String sellerPhone;
    /** Percentage, e.g. 20 for 20 %. 0 = no VAT breakdown on the invoice. */
    private final BigDecimal vatRate;
    /** First day of the main series; anything paid before it belongs to the archive (SL-A-). */
    private final LocalDate seriesCutoff;
    /** Business time zone: the cutoff, filters and printed dates are in this zone. */
    private final ZoneId zone;

    public InvoiceSettings(
            @Value("${app.invoice.seller.name:}") String sellerName,
            @Value("${app.invoice.seller.address:}") String sellerAddress,
            @Value("${app.invoice.seller.ice:}") String sellerIce,
            @Value("${app.invoice.seller.if:}") String sellerIf,
            @Value("${app.invoice.seller.rc:}") String sellerRc,
            @Value("${app.invoice.seller.email:}") String sellerEmail,
            @Value("${app.invoice.seller.phone:}") String sellerPhone,
            @Value("${app.invoice.vat-rate:0}") String vatRate,
            @Value("${app.invoice.series-cutoff:2026-11-26}") String seriesCutoff,
            @Value("${app.invoice.time-zone:Africa/Casablanca}") String zone) {
        this.sellerName = isBlank(sellerName) ? DEFAULT_SELLER_NAME : sellerName.trim();
        this.sellerAddress = clean(sellerAddress);
        this.sellerIce = clean(sellerIce);
        this.sellerIf = clean(sellerIf);
        this.sellerRc = clean(sellerRc);
        this.sellerEmail = clean(sellerEmail);
        this.sellerPhone = clean(sellerPhone);
        this.vatRate = InvoiceMath.parseRate(vatRate);
        this.seriesCutoff = isBlank(seriesCutoff) ? LocalDate.of(2026, 11, 26) : LocalDate.parse(seriesCutoff.trim());
        this.zone = isBlank(zone) ? ZoneId.of("Africa/Casablanca") : ZoneId.of(zone.trim());
    }

    /** The cutoff instant expressed on the stored clock (timestamps are JVM wall-clock times). */
    public LocalDateTime seriesCutoffStored() {
        return InvoiceMath.toStored(seriesCutoff.atStartOfDay(), zone);
    }

    /** A stored timestamp shown in the business zone (for printed and exported dates). */
    public LocalDateTime toBusiness(LocalDateTime stored) {
        return InvoiceMath.toBusiness(stored, zone);
    }

    /** A business-zone date/time converted to the stored clock (for date filters). */
    public LocalDateTime toStored(LocalDateTime business) {
        return InvoiceMath.toStored(business, zone);
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static String clean(String s) { return isBlank(s) ? "" : s.trim(); }
}
