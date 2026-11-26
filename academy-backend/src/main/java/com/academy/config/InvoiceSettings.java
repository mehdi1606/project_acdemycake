package com.academy.config;

import com.academy.service.invoice.InvoiceMath;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

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

    public InvoiceSettings(
            @Value("${app.invoice.seller.name:}") String sellerName,
            @Value("${app.invoice.seller.address:}") String sellerAddress,
            @Value("${app.invoice.seller.ice:}") String sellerIce,
            @Value("${app.invoice.seller.if:}") String sellerIf,
            @Value("${app.invoice.seller.rc:}") String sellerRc,
            @Value("${app.invoice.seller.email:}") String sellerEmail,
            @Value("${app.invoice.seller.phone:}") String sellerPhone,
            @Value("${app.invoice.vat-rate:0}") String vatRate) {
        this.sellerName = isBlank(sellerName) ? DEFAULT_SELLER_NAME : sellerName.trim();
        this.sellerAddress = clean(sellerAddress);
        this.sellerIce = clean(sellerIce);
        this.sellerIf = clean(sellerIf);
        this.sellerRc = clean(sellerRc);
        this.sellerEmail = clean(sellerEmail);
        this.sellerPhone = clean(sellerPhone);
        this.vatRate = InvoiceMath.parseRate(vatRate);
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    private static String clean(String s) { return isBlank(s) ? "" : s.trim(); }
}
