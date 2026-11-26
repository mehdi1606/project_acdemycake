package com.academy.service.invoice;

import com.academy.entity.Invoice;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Admin invoice filter. Dates are already converted to the stored clock;
 * {@code toExclusive} is the start of the day after the last day asked for.
 */
public record InvoiceFilter(String q, String series, InvoiceCategory category,
                            LocalDateTime from, LocalDateTime toExclusive) {

    public Predicate toPredicate(Root<Invoice> root, CriteriaBuilder cb) {
        List<Predicate> where = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT)
                    .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where.add(cb.or(
                    likeLower(cb, root.get("invoiceNumber"), like),
                    likeLower(cb, root.get("buyerName"), like),
                    likeLower(cb, root.get("buyerEmail"), like),
                    likeLower(cb, root.get("buyerPhone"), like)));
        }
        if (series != null) where.add(cb.equal(root.get("series"), series));
        if (category != null) where.add(categoryPredicate(root, cb, category));
        if (from != null) where.add(cb.greaterThanOrEqualTo(root.get("issuedAt"), from));
        if (toExclusive != null) where.add(cb.lessThan(root.get("issuedAt"), toExclusive));
        return cb.and(where.toArray(new Predicate[0]));
    }

    private static Predicate likeLower(CriteriaBuilder cb, Expression<String> field, String like) {
        return cb.like(cb.lower(field), like, '\\');
    }

    /** Mirrors {@link InvoiceCategory#of}. */
    private static Predicate categoryPredicate(Root<Invoice> root, CriteriaBuilder cb, InvoiceCategory c) {
        Expression<String> type = root.get("paymentType");
        Predicate masterclassLine = cb.like(root.get("itemDescription"), InvoiceCategory.MASTERCLASS_PREFIX + "%");
        return switch (c) {
            case SUBSCRIPTION -> cb.equal(type, "SUBSCRIPTION");
            case EBOOK -> cb.equal(type, "EBOOK_PURCHASE");
            case MANUAL -> cb.equal(type, InvoiceIssuer.MANUAL_BOOKING);
            case MASTERCLASS -> cb.and(cb.equal(type, "COURSE_PURCHASE"), masterclassLine);
            case COURSE -> cb.and(cb.equal(type, "COURSE_PURCHASE"), cb.not(masterclassLine));
            case OTHER -> cb.not(type.in("SUBSCRIPTION", "EBOOK_PURCHASE", InvoiceIssuer.MANUAL_BOOKING, "COURSE_PURCHASE"));
        };
    }
}
