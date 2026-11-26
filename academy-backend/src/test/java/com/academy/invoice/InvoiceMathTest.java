package com.academy.invoice;

import com.academy.service.invoice.InvoiceMath;
import com.academy.service.invoice.InvoiceMath.VatBreakdown;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class InvoiceMathTest {

    @Test
    @DisplayName("Invoice numbers are SL-<year>-<6 digits>")
    void numberFormat() {
        assertEquals("SL-2026-000001", InvoiceMath.formatNumber(2026, 1));
        assertEquals("SL-2026-001234", InvoiceMath.formatNumber(2026, 1234));
        assertEquals("SL-2027-999999", InvoiceMath.formatNumber(2027, 999999));
    }

    @Test
    @DisplayName("VAT 0: HT equals the paid total, no VAT")
    void noVat() {
        VatBreakdown b = InvoiceMath.fromPaidTotal(new BigDecimal("390"), BigDecimal.ZERO);
        assertFalse(b.hasVat());
        assertEquals(new BigDecimal("390.00"), b.ttc());
        assertEquals(new BigDecimal("390.00"), b.ht());
        assertEquals(new BigDecimal("0.00"), b.vat());
    }

    @Test
    @DisplayName("VAT 20 %: computed back from the paid total, HT + TVA = TTC")
    void vat20() {
        VatBreakdown b = InvoiceMath.fromPaidTotal(new BigDecimal("1200.00"), new BigDecimal("20"));
        assertTrue(b.hasVat());
        assertEquals(new BigDecimal("1000.00"), b.ht());
        assertEquals(new BigDecimal("200.00"), b.vat());
        assertEquals(new BigDecimal("1200.00"), b.ttc());
    }

    @Test
    @DisplayName("Rounding to 2 decimals never loses a centime")
    void roundingKeepsTotal() {
        for (String paid : new String[]{"390.00", "3900.00", "899.00", "0.01", "99.99", "1234.57"}) {
            for (String rate : new String[]{"20", "10", "7", "14", "5.5"}) {
                VatBreakdown b = InvoiceMath.fromPaidTotal(new BigDecimal(paid), new BigDecimal(rate));
                assertEquals(b.ttc(), b.ht().add(b.vat()), paid + " @ " + rate);
                assertEquals(2, b.ht().scale());
                assertEquals(2, b.vat().scale());
            }
        }
        // 390 TTC at 20 %: 325.00 HT + 65.00 TVA
        VatBreakdown b = InvoiceMath.fromPaidTotal(new BigDecimal("390"), new BigDecimal("20"));
        assertEquals(new BigDecimal("325.00"), b.ht());
        assertEquals(new BigDecimal("65.00"), b.vat());
        // 899 TTC at 20 %: 749.17 HT + 149.83 TVA
        b = InvoiceMath.fromPaidTotal(new BigDecimal("899"), new BigDecimal("20"));
        assertEquals(new BigDecimal("749.17"), b.ht());
        assertEquals(new BigDecimal("149.83"), b.vat());
    }

    @Test
    @DisplayName("Configured rates: blank, invalid or out of range mean no VAT")
    void parseRate() {
        assertEquals(new BigDecimal("0.00"), InvoiceMath.parseRate(null));
        assertEquals(new BigDecimal("0.00"), InvoiceMath.parseRate(""));
        assertEquals(new BigDecimal("0.00"), InvoiceMath.parseRate("abc"));
        assertEquals(new BigDecimal("0.00"), InvoiceMath.parseRate("-5"));
        assertEquals(new BigDecimal("0.00"), InvoiceMath.parseRate("150"));
        assertEquals(new BigDecimal("20.00"), InvoiceMath.parseRate("20"));
        assertEquals(new BigDecimal("20.00"), InvoiceMath.parseRate(" 20 % "));
        assertEquals(new BigDecimal("5.50"), InvoiceMath.parseRate("5,5"));
    }

    @Test
    @DisplayName("French money and percent formatting")
    void formatting() {
        assertEquals("1 234,50 MAD", InvoiceMath.money(new BigDecimal("1234.5"), "MAD"));
        assertEquals("390,00 MAD", InvoiceMath.money(new BigDecimal("390"), "MAD"));
        assertEquals("20 %", InvoiceMath.percent(new BigDecimal("20.00")));
        assertEquals("5,5 %", InvoiceMath.percent(new BigDecimal("5.50")));
    }

    @Test
    @DisplayName("Arabic text is detected (it cannot be printed in the PDF)")
    void arabic() {
        assertTrue(InvoiceMath.hasArabic("سارة"));
        assertTrue(InvoiceMath.hasArabic("Sara سارة"));
        assertFalse(InvoiceMath.hasArabic("Sara Löwe"));
        assertFalse(InvoiceMath.hasArabic(null));
    }
}
