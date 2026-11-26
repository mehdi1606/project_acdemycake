package com.academy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An invoice issued for one successful payment. Everything printed on it is a
 * snapshot taken at issue time; rows are inserted once and never updated.
 * The buyer is kept as a plain id (not a relation) so soft-deleted users,
 * hidden by User's SQL restriction, never break reading an old invoice.
 */
@Entity
@Immutable
@Table(name = "invoices", indexes = {
        @Index(name = "idx_invoices_user_id", columnList = "user_id, issued_at DESC"),
        @Index(name = "idx_invoices_issued_at", columnList = "issued_at DESC")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, length = 30, unique = true)
    private String invoiceNumber;

    @Column(name = "invoice_year", nullable = false)
    private Integer invoiceYear;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "payment_id", nullable = false, unique = true)
    private UUID paymentId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(name = "buyer_email", length = 255)
    private String buyerEmail;

    @Column(name = "item_description", nullable = false, length = 500)
    private String itemDescription;

    @Column(name = "payment_type", nullable = false, length = 30)
    private String paymentType;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod;

    @Column(name = "order_reference", length = 100)
    private String orderReference;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "amount_ht", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountHt;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "vat_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "amount_ttc", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountTtc;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
