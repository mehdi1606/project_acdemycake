package com.academy.service;

import com.academy.dto.response.AdminInvoiceListResponse;
import com.academy.entity.Invoice;
import com.academy.service.invoice.InvoiceFilter;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDate;
import java.util.List;

/** Admin invoices page: search with totals, CSV export and ZIP of PDFs. */
public interface AdminInvoiceService {

    /** Most PDFs in one ZIP download. */
    int MAX_ZIP_INVOICES = 500;

    /**
     * Builds a filter from request parameters; dates are business-zone days (inclusive).
     * @param series "A", "MAIN" or blank; @param type subscription|course|masterclass|ebook|manual or blank
     */
    InvoiceFilter filter(String q, String series, String type, LocalDate from, LocalDate to);

    AdminInvoiceListResponse search(InvoiceFilter filter, int page, int size);

    /** UTF-8 (with BOM) CSV, ';' separated, for French Excel. */
    byte[] exportCsv(InvoiceFilter filter);

    /** Number of invoices matching the filter. */
    long count(InvoiceFilter filter);

    /** The newest {@link #MAX_ZIP_INVOICES} invoices matching the filter. */
    List<Invoice> forZip(InvoiceFilter filter);

    /** Writes one PDF per invoice (named by invoice number) into a ZIP stream. */
    void writeZip(List<Invoice> invoices, OutputStream out) throws IOException;
}
