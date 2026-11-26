package com.academy.dto.response;

import com.academy.entity.Invoice;
import com.academy.service.invoice.InvoiceCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private UUID id;
    private String invoiceNumber;
    /** "A" (archive) or "MAIN". */
    private String series;
    private UUID paymentId;
    private UUID manualBookingId;
    private UUID userId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    private String itemDescription;
    private String paymentType;
    /** SUBSCRIPTION, COURSE, MASTERCLASS, EBOOK, MANUAL or OTHER. */
    private String category;
    private String paymentMethod;
    private String orderReference;
    private String paymentReference;
    private String currency;
    private BigDecimal amountHt;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal amountTtc;
    /** Payment date, in the business time zone (Africa/Casablanca). */
    private LocalDateTime issuedAt;

    public static InvoiceResponse fromEntity(Invoice i, LocalDateTime issuedAtBusiness) {
        return InvoiceResponse.builder()
                .id(i.getId())
                .invoiceNumber(i.getInvoiceNumber())
                .series(i.getSeries())
                .paymentId(i.getPaymentId())
                .manualBookingId(i.getManualBookingId())
                .userId(i.getUserId())
                .buyerName(i.getBuyerName())
                .buyerEmail(i.getBuyerEmail())
                .buyerPhone(i.getBuyerPhone())
                .itemDescription(i.getItemDescription())
                .paymentType(i.getPaymentType())
                .category(InvoiceCategory.of(i.getPaymentType(), i.getItemDescription()).name())
                .paymentMethod(i.getPaymentMethod())
                .orderReference(i.getOrderReference())
                .paymentReference(i.getPaymentReference())
                .currency(i.getCurrency())
                .amountHt(i.getAmountHt())
                .vatRate(i.getVatRate())
                .vatAmount(i.getVatAmount())
                .amountTtc(i.getAmountTtc())
                .issuedAt(issuedAtBusiness)
                .build();
    }
}
