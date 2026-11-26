package com.academy.service.impl;

import com.academy.config.InvoiceSettings;
import com.academy.dto.response.AdminInvoiceListResponse;
import com.academy.dto.response.InvoiceResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Invoice;
import com.academy.exception.BadRequestException;
import com.academy.repository.InvoiceRepository;
import com.academy.service.AdminInvoiceService;
import com.academy.service.invoice.InvoiceCategory;
import com.academy.service.invoice.InvoiceFilter;
import com.academy.service.invoice.InvoiceMath;
import com.academy.service.invoice.InvoicePdfRenderer;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminInvoiceServiceImpl implements AdminInvoiceService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_CSV_ROWS = 50_000;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("issuedAt"), Sort.Order.desc("invoiceNumber"));
    private static final DateTimeFormatter CSV_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfRenderer renderer;
    private final InvoiceSettings settings;
    private final EntityManager entityManager;

    @Override
    public InvoiceFilter filter(String q, String series, String type, LocalDate from, LocalDate to) {
        String s = null;
        if (series != null && !series.isBlank()) {
            s = series.trim().toUpperCase(Locale.ROOT);
            if (!s.equals(InvoiceMath.SERIES_ARCHIVE) && !s.equals(InvoiceMath.SERIES_MAIN)) {
                throw new BadRequestException("Invalid series: " + series);
            }
        }
        InvoiceCategory category = InvoiceCategory.parse(type);
        if (category == null && type != null && !type.isBlank()) {
            throw new BadRequestException("Invalid invoice type: " + type);
        }
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("The end date is before the start date");
        }
        return new InvoiceFilter(
                q == null || q.isBlank() ? null : q.trim(), s, category,
                from == null ? null : settings.toStored(from.atStartOfDay()),
                to == null ? null : settings.toStored(to.plusDays(1).atStartOfDay()));
    }

    @Override
    public AdminInvoiceListResponse search(InvoiceFilter filter, int page, int size) {
        PageRequest p = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), NEWEST_FIRST);
        PageResponse<InvoiceResponse> invoices = PageResponse.from(
                invoiceRepository.findAll(spec(filter), p), this::toResponse);
        return AdminInvoiceListResponse.builder().invoices(invoices).totals(totals(filter)).build();
    }

    @Override
    public long count(InvoiceFilter filter) {
        return invoiceRepository.count(spec(filter));
    }

    @Override
    public List<Invoice> forZip(InvoiceFilter filter) {
        return invoiceRepository.findAll(spec(filter), PageRequest.of(0, MAX_ZIP_INVOICES, NEWEST_FIRST)).getContent();
    }

    @Override
    public void writeZip(List<Invoice> invoices, OutputStream out) throws IOException {
        ZipOutputStream zip = new ZipOutputStream(out, StandardCharsets.UTF_8);
        Set<String> names = new HashSet<>();
        for (Invoice invoice : invoices) {
            String name = invoice.getInvoiceNumber() + ".pdf";
            if (!names.add(name)) continue;
            zip.putNextEntry(new ZipEntry(name));
            zip.write(renderer.render(invoice));
            zip.closeEntry();
        }
        zip.finish();
        zip.flush();
    }

    @Override
    public byte[] exportCsv(InvoiceFilter filter) {
        List<Invoice> rows = invoiceRepository.findAll(spec(filter), PageRequest.of(0, MAX_CSV_ROWS, NEWEST_FIRST))
                .getContent();
        StringBuilder csv = new StringBuilder("﻿");
        line(csv, "Numéro", "Date", "Série", "Client", "Email / Téléphone", "Désignation", "Type",
                "Moyen de paiement", "Total HT", "Taux TVA (%)", "TVA", "Total TTC", "Devise", "Réf. commande");
        for (Invoice i : rows) {
            line(csv,
                    i.getInvoiceNumber(),
                    settings.toBusiness(i.getIssuedAt()).format(CSV_DATE),
                    InvoiceMath.SERIES_ARCHIVE.equals(i.getSeries()) ? "Archive (A)" : "Principale",
                    i.getBuyerName(),
                    i.getBuyerEmail() != null && !i.getBuyerEmail().isBlank() ? i.getBuyerEmail() : i.getBuyerPhone(),
                    i.getItemDescription(),
                    typeLabel(InvoiceCategory.of(i.getPaymentType(), i.getItemDescription())),
                    i.getPaymentMethod(),
                    decimal(i.getAmountHt()),
                    decimal(i.getVatRate()),
                    decimal(i.getVatAmount()),
                    decimal(i.getAmountTtc()),
                    i.getCurrency(),
                    i.getOrderReference());
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Specification<Invoice> spec(InvoiceFilter filter) {
        return (root, query, cb) -> filter.toPredicate(root, cb);
    }

    private InvoiceResponse toResponse(Invoice i) {
        return InvoiceResponse.fromEntity(i, settings.toBusiness(i.getIssuedAt()));
    }

    private AdminInvoiceListResponse.Totals totals(InvoiceFilter filter) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> q = cb.createTupleQuery();
        Root<Invoice> root = q.from(Invoice.class);
        q.multiselect(
                cb.count(root),
                cb.sum(root.<BigDecimal>get("amountHt")),
                cb.sum(root.<BigDecimal>get("vatAmount")),
                cb.sum(root.<BigDecimal>get("amountTtc")));
        q.where(filter.toPredicate(root, cb));
        Tuple t = entityManager.createQuery(q).getSingleResult();
        return AdminInvoiceListResponse.Totals.builder()
                .count(t.get(0, Long.class))
                .amountHt(orZero(t.get(1, BigDecimal.class)))
                .vatAmount(orZero(t.get(2, BigDecimal.class)))
                .amountTtc(orZero(t.get(3, BigDecimal.class)))
                .build();
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO.setScale(2) : v;
    }

    static String typeLabel(InvoiceCategory c) {
        return switch (c) {
            case SUBSCRIPTION -> "Abonnement";
            case COURSE -> "Cours";
            case MASTERCLASS -> "Masterclass";
            case EBOOK -> "Ebook";
            case MANUAL -> "Réservation directe";
            case OTHER -> "Autre";
        };
    }

    /** 1234,50 (French Excel decimal comma, no grouping). */
    private static String decimal(BigDecimal v) {
        return v == null ? "" : v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private static void line(StringBuilder csv, String... cells) {
        for (int k = 0; k < cells.length; k++) {
            if (k > 0) csv.append(';');
            csv.append(cell(cells[k]));
        }
        csv.append("\r\n");
    }

    /** Quotes when needed, and neutralises spreadsheet formulas (=, +, -, @) in text. */
    static String cell(String v) {
        if (v == null) return "";
        String s = v.replace("\r", " ").replace("\n", " ");
        // Numbers and phone numbers (+212 6...) are harmless and stay as they are.
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0 && !s.matches("[+-]?[0-9 ().,-]+")) s = "'" + s;
        if (s.contains(";") || s.contains("\"")) s = "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}
