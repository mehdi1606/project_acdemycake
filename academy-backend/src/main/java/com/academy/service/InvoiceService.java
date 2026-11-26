package com.academy.service;

import com.academy.dto.response.InvoiceResponse;
import com.academy.dto.response.PageResponse;

import java.util.UUID;

public interface InvoiceService {

    /** A rendered invoice ready to send: file name (SL-2026-000001.pdf) and PDF bytes. */
    record InvoicePdf(String filename, byte[] content) {}

    /** The signed-in user's invoices, newest first. */
    PageResponse<InvoiceResponse> getMyInvoices(int page, int size);

    /** PDF of an invoice; for its buyer, an admin, or the instructor of the course bought. */
    InvoicePdf download(UUID invoiceId);

    /**
     * PDF of the invoice for a payment; only its buyer or an admin may download it.
     * A COMPLETED payment whose invoice is not issued yet gets it issued now.
     */
    InvoicePdf downloadForPayment(UUID paymentId);

    /**
     * PDF of the invoice for a masterclass booking paid outside the platform; for an
     * admin, the masterclass's instructor, or the linked account. Issued now if missing.
     */
    InvoicePdf downloadForManualBooking(UUID bookingId);

    /** Admin: every invoice, optionally filtered by number, buyer name or email. */
    PageResponse<InvoiceResponse> searchInvoices(String query, int page, int size);
}
