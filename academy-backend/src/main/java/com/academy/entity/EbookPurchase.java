package com.academy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Proof that a user owns an ebook — this is what "saved in his account" means.
 *
 * Created only from a COMPLETED payment callback. Every read/download request
 * is authorised against this table, so ownership is the single source of truth
 * and never depends on a URL being secret.
 *
 * Deliberately independent of any subscription: a student with a plain account
 * and no plan can buy and keep an ebook.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "ebook_purchases",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_ebook_purchase_user_ebook",
        columnNames = {"user_id", "ebook_id"}
    )
)
public class EbookPurchase extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ebook_id", nullable = false)
    private Ebook ebook;

    /** The CMI order id that paid for this, kept for support and reconciliation. */
    @Column(name = "order_id", length = 100)
    private String orderId;

    @Column(name = "amount_paid", precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "purchased_at", nullable = false)
    @Builder.Default
    private LocalDateTime purchasedAt = LocalDateTime.now();

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;
}
