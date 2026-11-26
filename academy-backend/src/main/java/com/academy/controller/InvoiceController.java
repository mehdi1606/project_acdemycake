package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.InvoiceResponse;
import com.academy.dto.response.PageResponse;
import com.academy.service.InvoiceService;
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
    @Operation(summary = "Admin: list or search invoices (number, buyer name or email)")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> searchInvoices(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.searchInvoices(q, page, size)));
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
