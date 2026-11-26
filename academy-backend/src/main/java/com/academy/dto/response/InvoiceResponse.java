package com.academy.dto.response;

import com.academy.entity.Invoice;
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
    private UUID paymentId;
    private UUID userId;
    private String buyerName;
    private String buyerEmail;
    private String itemDescription;
    private String paymentType;
    private String currency;
    private BigDecimal amountHt;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal amountTtc;
    private LocalDateTime issuedAt;

    public static InvoiceResponse fromEntity(Invoice i) {
        return InvoiceResponse.builder()
                .id(i.getId())
                .invoiceNumber(i.getInvoiceNumber())
                .paymentId(i.getPaymentId())
                .userId(i.getUserId())
                .buyerName(i.getBuyerName())
                .buyerEmail(i.getBuyerEmail())
                .itemDescription(i.getItemDescription())
                .paymentType(i.getPaymentType())
                .currency(i.getCurrency())
                .amountHt(i.getAmountHt())
                .vatRate(i.getVatRate())
                .vatAmount(i.getVatAmount())
                .amountTtc(i.getAmountTtc())
                .issuedAt(i.getIssuedAt())
                .build();
    }
}
