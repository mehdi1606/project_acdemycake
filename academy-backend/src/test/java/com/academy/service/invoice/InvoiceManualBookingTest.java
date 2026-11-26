package com.academy.service.invoice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InvoiceManualBookingTest {

    private static InvoiceIssuer.PaidRow manual(String title, String titleFr, LocalDate session) {
        return new InvoiceIssuer.PaidRow(true, UUID.randomUUID(), null, InvoiceIssuer.MANUAL_BOOKING,
                new BigDecimal("1500.00"), "MAD", null, null, null, null, LocalDateTime.of(2026, 3, 2, 10, 0),
                "Sara", null, "+212600000000",
                title, titleFr, null, "MASTERCLASS", "LIVE", session, null, null, null);
    }

    @Test
    @DisplayName("Manual booking: same line as a card-paid live masterclass")
    void manualDescription() {
        assertEquals("Masterclass en direct : Wedding Cake (séance du 14/03/2026)",
                InvoiceIssuer.describe(manual("Wedding Cake", null, LocalDate.of(2026, 3, 14))));
        // French title preferred, Arabic title skipped
        assertEquals("Masterclass en direct : Gâteau de mariage (séance du 14/03/2026)",
                InvoiceIssuer.describe(manual("كعكة الزفاف", "Gâteau de mariage", LocalDate.of(2026, 3, 14))));
        assertEquals("Masterclass en direct",
                InvoiceIssuer.describe(manual("كعكة الزفاف", null, null)));
    }

    @Test
    @DisplayName("Buyer block: name, then email, else phone; Arabic names are not printed")
    void buyerFallback() {
        assertEquals(List.of("Sara Alaoui", "sara@example.test"),
                InvoiceMath.buyerLines("Sara Alaoui", "sara@example.test", "+212600000000"));
        assertEquals(List.of("Sara Alaoui", "+212600000000"),
                InvoiceMath.buyerLines("Sara Alaoui", null, "+212600000000"));
        assertEquals(List.of("+212600000000"),
                InvoiceMath.buyerLines("سارة", "  ", "+212600000000"));
        assertEquals(List.of("Sara Alaoui"), InvoiceMath.buyerLines("Sara Alaoui", null, null));
    }
}
