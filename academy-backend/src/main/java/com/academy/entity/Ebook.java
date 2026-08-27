package com.academy.entity;

import com.academy.entity.enums.EbookStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * A paid digital book sold one-off (no subscription required).
 *
 * The PDF itself is NOT stored under {@code uploads/} — that directory is served
 * publicly by FileController at /files/** (permitAll). Ebook files live in
 * {@code app.file.ebook-dir} and are only ever streamed by an endpoint that has
 * first checked the caller owns the book.
 *
 * A title may exist in several languages (e.g. Alchemy in Layers ships a French
 * and an Arabic edition). One purchase grants every edition of that title.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ebooks")
public class Ebook extends BaseEntity {

    @Column(name = "slug", nullable = false, unique = true, length = 200)
    private String slug;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "title_en", columnDefinition = "TEXT")
    private String titleEn;

    @Column(name = "title_fr", columnDefinition = "TEXT")
    private String titleFr;

    @Column(name = "title_ar", columnDefinition = "TEXT")
    private String titleAr;

    @Column(name = "subtitle", length = 300)
    private String subtitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "description_fr", columnDefinition = "TEXT")
    private String descriptionFr;

    @Column(name = "description_ar", columnDefinition = "TEXT")
    private String descriptionAr;

    /** Cover image — safe to live in uploads/ since it is public marketing material. */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "page_count")
    private Integer pageCount;

    // ── Per-language PDF file names, relative to the secure ebook directory ──
    // Null means that edition does not exist for this title.

    @Column(name = "pdf_en", length = 300)
    private String pdfEn;

    @Column(name = "pdf_fr", length = 300)
    private String pdfFr;

    @Column(name = "pdf_ar", length = 300)
    private String pdfAr;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EbookStatus status = EbookStatus.DRAFT;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "purchase_count", nullable = false)
    @Builder.Default
    private Integer purchaseCount = 0;

    /** File name for a language code, falling back to any edition that exists. */
    public String resolvePdf(String language) {
        String wanted = switch (language == null ? "" : language.toLowerCase()) {
            case "ar" -> pdfAr;
            case "fr" -> pdfFr;
            case "en" -> pdfEn;
            default   -> null;
        };
        if (wanted != null && !wanted.isBlank()) return wanted;
        if (pdfEn != null && !pdfEn.isBlank()) return pdfEn;
        if (pdfFr != null && !pdfFr.isBlank()) return pdfFr;
        return pdfAr;
    }
}
