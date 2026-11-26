package com.academy.service.invoice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InvoiceSeriesTest {

    private static final LocalDateTime CUTOFF = LocalDateTime.of(2026, 11, 26, 0, 0);

    @Test
    @DisplayName("Paid before the cutoff: archive; at or after it: main")
    void cutoffRule() {
        assertEquals("A", InvoiceMath.seriesFor(CUTOFF.minusSeconds(1), CUTOFF));
        assertEquals("A", InvoiceMath.seriesFor(LocalDateTime.of(2026, 6, 15, 10, 0), CUTOFF));
        assertEquals("MAIN", InvoiceMath.seriesFor(CUTOFF, CUTOFF));
        assertEquals("MAIN", InvoiceMath.seriesFor(LocalDateTime.of(2027, 1, 2, 9, 0), CUTOFF));
    }

    @Test
    @DisplayName("Archive numbers SL-A-0001, main numbers unchanged")
    void numbers() {
        assertEquals("SL-A-0001", InvoiceMath.formatArchiveNumber(1));
        assertEquals("SL-A-0134", InvoiceMath.formatArchiveNumber(134));
        assertEquals("SL-A-12345", InvoiceMath.formatArchiveNumber(12345));
        assertEquals("SL-2026-000001", InvoiceMath.formatNumber(2026, 1));
    }

    @Test
    @DisplayName("Casablanca midnight converts to the stored clock and back")
    void zones() {
        ZoneId casa = ZoneId.of("Africa/Casablanca");
        LocalDateTime stored = InvoiceMath.toStored(CUTOFF, casa);
        assertEquals(CUTOFF, InvoiceMath.toBusiness(stored, casa));
        // On a UTC clock (production), the cutoff is Casablanca midnight minus its UTC offset.
        LocalDateTime utc = CUTOFF.atZone(casa).withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
        int offsetSeconds = casa.getRules().getOffset(CUTOFF).getTotalSeconds();
        assertEquals(CUTOFF.minusSeconds(offsetSeconds), utc);
    }

    @Test
    @DisplayName("Invoice categories follow the printed item line")
    void categories() {
        assertEquals(InvoiceCategory.SUBSCRIPTION, InvoiceCategory.of("SUBSCRIPTION", "Abonnement Premium annuel (12 mois)"));
        assertEquals(InvoiceCategory.MASTERCLASS, InvoiceCategory.of("COURSE_PURCHASE", "Masterclass en direct : X"));
        assertEquals(InvoiceCategory.COURSE, InvoiceCategory.of("COURSE_PURCHASE", "Cours en ligne : X"));
        assertEquals(InvoiceCategory.EBOOK, InvoiceCategory.of("EBOOK_PURCHASE", "Ebook : X"));
        assertEquals(InvoiceCategory.MANUAL, InvoiceCategory.of("MANUAL_BOOKING", "Masterclass en direct : X"));
        assertEquals(InvoiceCategory.MASTERCLASS, InvoiceCategory.parse(" masterclass "));
        assertEquals(null, InvoiceCategory.parse("nope"));
    }
}
