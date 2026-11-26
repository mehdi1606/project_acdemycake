package com.academy.service.invoice;

import java.util.Locale;

/**
 * What an invoice is for, derived from its snapshot (payment type and the printed
 * item line), so it always matches what the PDF says.
 */
public enum InvoiceCategory {
    SUBSCRIPTION, COURSE, MASTERCLASS, EBOOK, MANUAL, OTHER;

    /** Item lines of card-paid masterclasses start with this (see InvoiceIssuer.describe). */
    public static final String MASTERCLASS_PREFIX = "Masterclass";

    public static InvoiceCategory of(String paymentType, String itemDescription) {
        if (paymentType == null) return OTHER;
        return switch (paymentType) {
            case "SUBSCRIPTION" -> SUBSCRIPTION;
            case "EBOOK_PURCHASE" -> EBOOK;
            case InvoiceIssuer.MANUAL_BOOKING -> MANUAL;
            case "COURSE_PURCHASE" -> itemDescription != null && itemDescription.startsWith(MASTERCLASS_PREFIX)
                    ? MASTERCLASS : COURSE;
            default -> OTHER;
        };
    }

    /** Parses a filter value ("subscription", "course", ...); null when blank. */
    public static InvoiceCategory parse(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
