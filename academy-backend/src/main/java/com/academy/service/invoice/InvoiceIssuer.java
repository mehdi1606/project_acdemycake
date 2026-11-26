package com.academy.service.invoice;

import com.academy.config.InvoiceSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Issues invoices: one per COMPLETED payment, numbered SL-&lt;year&gt;-NNNNNN without gaps
 * (main series), or SL-A-NNNN for anything paid before the series cutoff (archive).
 *
 * <p>Every path (live payment, startup backfill, periodic safety sweep, on-demand
 * download) runs the same {@link #issueMissing()} sweep: under a transaction-scoped
 * advisory lock it takes the COMPLETED payments that have no invoice yet, oldest
 * payment first, and issues them in that order. So numbers follow payment order,
 * two sweeps never race, and a crash between a payment and its invoice is
 * repaired by the next sweep. The year counter is incremented in the same
 * transaction as the insert, so a failed issue never burns a number.
 *
 * <p>Masterclass participants paid outside the platform (manual bookings with an
 * amount, not cancelled) are invoiced the same way, in the same sequence.
 *
 * <p>Refunded, failed and cancelled payments are never invoiced. An invoice
 * already issued is never changed (a later refund or cancellation leaves it as it was).
 */
@Slf4j
@Component
public class InvoiceIssuer {

    /** pg_advisory_xact_lock key shared by every invoice-issuing transaction ("SLINV"). */
    static final long LOCK_KEY = 0x534C494E56L;
    private static final int BATCH = 200;
    /** payment_type of an invoice for a masterclass booking paid outside the platform. */
    public static final String MANUAL_BOOKING = "MANUAL_BOOKING";
    public static final String MANUAL_METHOD = "Paiement direct (virement / espèces)";
    private static final DateTimeFormatter SESSION_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final NamedParameterJdbcTemplate jdbc;
    private final InvoiceSettings settings;
    private final TransactionTemplate tx;

    public InvoiceIssuer(NamedParameterJdbcTemplate jdbc, InvoiceSettings settings,
                         PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.settings = settings;
        this.tx = new TransactionTemplate(transactionManager);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ── Triggers ─────────────────────────────────────────────────────────────

    /** A payment was settled: issue its invoice once that transaction has committed. */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        safeSweep("payment " + event.paymentId());
    }

    /** A participant paid outside the platform was added: invoice it after commit. */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onManualBookingAdded(ManualBookingAddedEvent event) {
        safeSweep("manual booking " + event.bookingId());
    }

    /** Backfill: invoices for every successful payment made before this feature existed. */
    @EventListener(ApplicationReadyEvent.class)
    public void backfillOnStartup() {
        safeSweep("startup backfill");
    }

    /** Safety net for an invoice missed by a crash or a failed async run. */
    @Scheduled(initialDelay = 15 * 60 * 1000L, fixedDelay = 15 * 60 * 1000L)
    public void periodicSweep() {
        safeSweep("periodic sweep");
    }

    private void safeSweep(String reason) {
        try {
            int n = issueMissing();
            if (n > 0) log.info("Invoices issued ({}): {}", reason, n);
        } catch (Exception e) {
            log.error("Invoice issuing failed ({}): {}", reason, e.getMessage(), e);
        }
    }

    // ── Sweep ────────────────────────────────────────────────────────────────

    /** Issues every missing invoice, oldest payment first. Returns how many were issued. */
    public int issueMissing() {
        int total = 0;
        while (true) {
            Integer n = tx.execute(status -> issueBatch());
            int issued = n == null ? 0 : n;
            total += issued;
            if (issued < BATCH) return total;
        }
    }

    private int issueBatch() {
        jdbc.getJdbcTemplate().execute("SELECT pg_advisory_xact_lock(" + LOCK_KEY + ")");

        // Card payments and manual masterclass bookings, oldest first, so both share
        // one numbering in date order.
        List<PaidRow> rows = jdbc.query("""
                SELECT * FROM (
                    SELECT FALSE AS manual, p.id, p.user_id, p.transaction_type, p.amount, p.currency,
                           p.payment_method, p.payment_url, p.payzone_order_id, p.payzone_transaction_id,
                           COALESCE(p.completed_at, p.created_at) AS paid_at, p.created_at AS src_created,
                           u.full_name, u.email, CAST(NULL AS VARCHAR) AS phone,
                           c.title AS c_title, c.title_fr AS c_title_fr, c.title_en AS c_title_en,
                           c.course_type, c.masterclass_format, c.session_date,
                           e.title AS e_title, e.title_fr AS e_title_fr, e.title_en AS e_title_en
                    FROM payment_transactions p
                    JOIN users u ON u.id = p.user_id
                    LEFT JOIN courses c ON p.transaction_type = 'COURSE_PURCHASE' AND c.id = p.reference_id
                    LEFT JOIN ebooks e ON p.transaction_type = 'EBOOK_PURCHASE' AND e.id = p.reference_id
                    WHERE p.status = 'COMPLETED'
                      AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.payment_id = p.id)
                    UNION ALL
                    SELECT TRUE, b.id, b.user_id, 'MANUAL_BOOKING', b.amount_paid, b.currency,
                           NULL, NULL, NULL, NULL,
                           b.created_at, b.created_at,
                           b.full_name, b.email, b.phone,
                           c.title, c.title_fr, c.title_en,
                           c.course_type, c.masterclass_format, c.session_date,
                           NULL, NULL, NULL
                    FROM masterclass_manual_bookings b
                    JOIN courses c ON c.id = b.course_id
                    WHERE b.cancelled_at IS NULL AND b.amount_paid > 0
                      AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.manual_booking_id = b.id)
                ) due
                ORDER BY paid_at, src_created, id
                LIMIT :batch
                """, new MapSqlParameterSource("batch", BATCH), InvoiceIssuer::mapRow);

        BigDecimal vatRate = settings.getVatRate();
        java.time.LocalDateTime cutoff = settings.seriesCutoffStored();
        for (PaidRow r : rows) {
            // Main series from the cutoff, numbered per year; anything older (a late
            // discovery) goes to the end of the archive, counter row 0.
            String series = InvoiceMath.seriesFor(r.paidAt(), cutoff);
            boolean archive = InvoiceMath.SERIES_ARCHIVE.equals(series);
            int year = archive ? InvoiceMath.ARCHIVE_YEAR : settings.toBusiness(r.paidAt()).getYear();
            Integer seq = jdbc.queryForObject("""
                    INSERT INTO invoice_counters (invoice_year, last_number) VALUES (:year, 1)
                    ON CONFLICT (invoice_year)
                    DO UPDATE SET last_number = invoice_counters.last_number + 1
                    RETURNING last_number
                    """, new MapSqlParameterSource("year", year), Integer.class);
            InvoiceMath.VatBreakdown vat = InvoiceMath.fromPaidTotal(r.amount(), vatRate);
            String number = archive ? InvoiceMath.formatArchiveNumber(seq) : InvoiceMath.formatNumber(year, seq);

            jdbc.update("""
                    INSERT INTO invoices (id, invoice_number, invoice_year, series, sequence_number, payment_id,
                        manual_booking_id, user_id, buyer_name, buyer_email, buyer_phone, item_description, payment_type, payment_method,
                        order_reference, payment_reference, currency, amount_ht, vat_rate, vat_amount,
                        amount_ttc, issued_at, created_at)
                    VALUES (:id, :number, :year, :series, :seq, :paymentId, :manualBookingId, :userId, :buyerName,
                        :buyerEmail, :buyerPhone, :description, :type, :method, :orderRef, :paymentRef, :currency, :ht, :rate,
                        :vat, :ttc, :issuedAt, :createdAt)
                    """, new MapSqlParameterSource()
                    .addValue("id", UUID.randomUUID())
                    .addValue("number", number)
                    .addValue("year", year)
                    .addValue("series", series)
                    .addValue("seq", seq)
                    .addValue("paymentId", r.manual() ? null : r.id())
                    .addValue("manualBookingId", r.manual() ? r.id() : null)
                    .addValue("userId", r.userId())
                    .addValue("buyerName", cut(r.fullName(), 255))
                    .addValue("buyerEmail", cut(r.email(), 255))
                    .addValue("buyerPhone", cut(r.phone(), 30))
                    .addValue("description", cut(describe(r), 500))
                    .addValue("type", r.type() == null ? "OTHER" : cut(r.type(), 30))
                    .addValue("method", cut(paymentMethod(r), 100))
                    .addValue("orderRef", cut(r.orderId(), 100))
                    .addValue("paymentRef", cut(paymentReference(r), 100))
                    .addValue("currency", r.currency() == null ? "MAD" : r.currency())
                    .addValue("ht", vat.ht())
                    .addValue("rate", vat.rate())
                    .addValue("vat", vat.vat())
                    .addValue("ttc", vat.ttc())
                    .addValue("issuedAt", Timestamp.valueOf(r.paidAt()))
                    .addValue("createdAt", Timestamp.valueOf(LocalDateTime.now())));
            log.info("Invoice {} issued for {} {}", number, r.manual() ? "manual booking" : "payment", r.id());
        }
        return rows.size();
    }

    // ── Snapshot helpers ─────────────────────────────────────────────────────

    /** Something to invoice: a card payment, or a manual booking when {@code manual} is true. */
    record PaidRow(boolean manual, UUID id, UUID userId, String type, BigDecimal amount, String currency,
                   String method, String paymentUrl, String orderId, String authCode,
                   LocalDateTime paidAt, String fullName, String email, String phone,
                   String courseTitle, String courseTitleFr, String courseTitleEn,
                   String courseType, String masterclassFormat, LocalDate sessionDate,
                   String ebookTitle, String ebookTitleFr, String ebookTitleEn) {}

    private static PaidRow mapRow(ResultSet rs, int i) throws SQLException {
        Date session = rs.getDate("session_date");
        return new PaidRow(
                rs.getBoolean("manual"),
                rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class),
                rs.getString("transaction_type"), rs.getBigDecimal("amount"), rs.getString("currency"),
                rs.getString("payment_method"), rs.getString("payment_url"),
                rs.getString("payzone_order_id"), rs.getString("payzone_transaction_id"),
                rs.getTimestamp("paid_at").toLocalDateTime(),
                rs.getString("full_name"), rs.getString("email"), rs.getString("phone"),
                rs.getString("c_title"), rs.getString("c_title_fr"), rs.getString("c_title_en"),
                rs.getString("course_type"), rs.getString("masterclass_format"),
                session == null ? null : session.toLocalDate(),
                rs.getString("e_title"), rs.getString("e_title_fr"), rs.getString("e_title_en"));
    }

    /** French item line. Titles are taken in French, else English, else the main title, skipping Arabic ones. */
    static String describe(PaidRow r) {
        String type = r.type() == null ? "" : r.type();
        switch (type) {
            case "COURSE_PURCHASE", MANUAL_BOOKING -> {
                boolean masterclass = "MASTERCLASS".equals(r.courseType());
                boolean live = masterclass && "LIVE".equals(r.masterclassFormat());
                String kind = live ? "Masterclass en direct" : masterclass ? "Masterclass" : "Cours en ligne";
                String title = latinTitle(r.courseTitleFr(), r.courseTitleEn(), r.courseTitle());
                String line = title == null ? kind : kind + " : " + title;
                if (live && r.sessionDate() != null) {
                    line += " (séance du " + r.sessionDate().format(SESSION_DATE) + ")";
                }
                return line;
            }
            case "SUBSCRIPTION" -> {
                boolean monthly = r.orderId() != null && r.orderId().startsWith("SUB-MON");
                return monthly ? "Abonnement Premium mensuel (1 mois)" : "Abonnement Premium annuel (12 mois)";
            }
            case "EBOOK_PURCHASE" -> {
                String title = latinTitle(r.ebookTitleFr(), r.ebookTitleEn(), r.ebookTitle());
                return title == null ? "Ebook" : "Ebook : " + title;
            }
            default -> {
                return "Achat SARALÖWE Academy";
            }
        }
    }

    private static String latinTitle(String... candidates) {
        for (String c : candidates) {
            if (c != null && !c.isBlank() && !InvoiceMath.hasArabic(c)) return c.trim();
        }
        return null;
    }

    private static String paymentMethod(PaidRow r) {
        if (r.manual()) return MANUAL_METHOD;
        if (r.method() != null && !r.method().isBlank()) return r.method().trim();
        return r.paymentUrl() != null ? "Carte bancaire (PayZone)" : "Carte bancaire (CMI)";
    }

    private static String paymentReference(PaidRow r) {
        String a = r.authCode();
        if (a == null || a.isBlank() || "ADMIN_MANUAL_FIX".equals(a)) return null;
        return a.trim();
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
