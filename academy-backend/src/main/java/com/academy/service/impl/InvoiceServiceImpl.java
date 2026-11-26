package com.academy.service.impl;

import com.academy.dto.response.InvoiceResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.Invoice;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.enums.PaymentStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.InvoiceRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.InvoiceService;
import com.academy.service.invoice.InvoiceIssuer;
import com.academy.service.invoice.InvoicePdfRenderer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private static final int MAX_PAGE_SIZE = 100;

    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final InvoiceIssuer invoiceIssuer;
    private final InvoicePdfRenderer renderer;

    @Override
    public PageResponse<InvoiceResponse> getMyInvoices(int page, int size) {
        UserPrincipal me = currentUser();
        return PageResponse.from(
                invoiceRepository.findByUserIdOrderByIssuedAtDesc(me.getId(), pageable(page, size)),
                InvoiceResponse::fromEntity);
    }

    @Override
    public InvoicePdf download(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        checkAccess(invoice.getUserId());
        return toPdf(invoice);
    }

    @Override
    public InvoicePdf downloadForPayment(UUID paymentId) {
        PaymentTransaction payment = transactionRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        checkAccess(payment.getUser().getId());

        Invoice invoice = invoiceRepository.findByPaymentId(paymentId).orElse(null);
        if (invoice == null && payment.getStatus() == PaymentStatus.COMPLETED) {
            // Normally issued right after the payment; this covers a missed run.
            // The issuer commits in its own transaction.
            invoiceIssuer.issueMissing();
            invoice = invoiceRepository.findByPaymentId(paymentId).orElse(null);
        }
        if (invoice == null) {
            throw new ResourceNotFoundException("No invoice exists for this payment");
        }
        return toPdf(invoice);
    }

    @Override
    public PageResponse<InvoiceResponse> searchInvoices(String query, int page, int size) {
        Pageable p = pageable(page, size);
        if (query == null || query.isBlank()) {
            return PageResponse.from(invoiceRepository.findAllByOrderByIssuedAtDesc(p), InvoiceResponse::fromEntity);
        }
        String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
        return PageResponse.from(invoiceRepository.search(like, p), InvoiceResponse::fromEntity);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private InvoicePdf toPdf(Invoice invoice) {
        return new InvoicePdf(invoice.getInvoiceNumber() + ".pdf", renderer.render(invoice));
    }

    /** The buyer, or an admin, may read an invoice. Anyone else gets 403. */
    private void checkAccess(UUID ownerId) {
        UserPrincipal me = currentUser();
        if (me.getRole() == UserRole.ADMIN) return;
        if (ownerId == null || !ownerId.equals(me.getId())) {
            throw new ForbiddenException("You don't have access to this invoice");
        }
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
    }

    private static UserPrincipal currentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
