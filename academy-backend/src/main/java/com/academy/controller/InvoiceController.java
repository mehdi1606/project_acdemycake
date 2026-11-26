package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.InvoiceResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.AdminInvoiceListResponse;
import com.academy.entity.Invoice;
import com.academy.service.AdminInvoiceService;
import com.academy.service.InvoiceService;
import com.academy.service.invoice.InvoiceFilter;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import com.academy.service.InvoiceService.InvoicePdf;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Invoices. Buyers list and download their own; admins download any and search
 * them. Ownership is checked in {@link InvoiceService}; /admin/** is also
 * restricted to ADMIN in SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Invoice PDFs for successful payments")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final AdminInvoiceService adminInvoiceService;

    @GetMapping("/invoices")
    @Operation(summary = "List my invoices")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getMyInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getMyInvoices(page, size)));
    }

    @GetMapping("/invoices/{id}/pdf")
    @Operation(summary = "Download one of my invoices as PDF")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        return pdf(invoiceService.download(id));
    }

    @GetMapping("/invoices/payment/{paymentId}/pdf")
    @Operation(summary = "Download the invoice of one of my payments as PDF")
    public ResponseEntity<byte[]> downloadForPayment(@PathVariable UUID paymentId) {
        return pdf(invoiceService.downloadForPayment(paymentId));
    }

    @GetMapping("/invoices/manual-booking/{bookingId}/pdf")
    @Operation(summary = "Download the invoice of a masterclass booking paid outside the platform "
            + "(admin, the masterclass's instructor, or the linked account)")
    public ResponseEntity<byte[]> downloadForManualBooking(@PathVariable UUID bookingId) {
        return pdf(invoiceService.downloadForManualBooking(bookingId));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @GetMapping("/admin/invoices")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: invoices with filters (q = number, buyer name/email/phone; series A|MAIN; "
            + "type subscription|course|masterclass|ebook|manual; from/to = days, inclusive) and totals")
    public ResponseEntity<ApiResponse<AdminInvoiceListResponse>> searchInvoices(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String series,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        InvoiceFilter filter = adminInvoiceService.filter(q, series, type, from, to);
        return ResponseEntity.ok(ApiResponse.success(adminInvoiceService.search(filter, page, size)));
    }

    @GetMapping("/admin/invoices/export.csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: invoices matching the filters as CSV (UTF-8 with BOM, ';' separated)")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String series,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] csv = adminInvoiceService.exportCsv(adminInvoiceService.filter(q, series, type, from, to));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment().filename(exportName("csv")).build());
        headers.setCacheControl("private, no-store");
        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @GetMapping("/admin/invoices/export.zip")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: PDFs of the invoices matching the filters, as a ZIP (newest "
            + AdminInvoiceService.MAX_ZIP_INVOICES + " at most)")
    public void exportZip(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String series,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletResponse response) throws IOException {
        InvoiceFilter filter = adminInvoiceService.filter(q, series, type, from, to);
        long total = adminInvoiceService.count(filter);
        List<Invoice> invoices = adminInvoiceService.forZip(filter);
        // Written straight to the response, PDF by PDF, so nothing big is held in memory.
        response.setContentType("application/zip");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(exportName("zip")).build().toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "private, no-store");
        response.setHeader("X-Invoice-Total", String.valueOf(total));
        response.setHeader("X-Invoice-Exported", String.valueOf(invoices.size()));
        adminInvoiceService.writeZip(invoices, response.getOutputStream());
        response.flushBuffer();
    }

    private static String exportName(String ext) {
        return "factures-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "." + ext;
    }

    @GetMapping("/admin/invoices/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: download any invoice as PDF")
    public ResponseEntity<byte[]> adminDownload(@PathVariable UUID id) {
        return pdf(invoiceService.download(id));
    }

    @GetMapping("/admin/invoices/payment/{paymentId}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: download the invoice of any payment as PDF")
    public ResponseEntity<byte[]> adminDownloadForPayment(@PathVariable UUID paymentId) {
        return pdf(invoiceService.downloadForPayment(paymentId));
    }

    private static ResponseEntity<byte[]> pdf(InvoicePdf invoice) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(invoice.filename()).build());
        headers.setCacheControl("private, no-store");
        return ResponseEntity.ok().headers(headers).body(invoice.content());
    }
}
