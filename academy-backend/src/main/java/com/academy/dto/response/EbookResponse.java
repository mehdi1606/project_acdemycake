package com.academy.dto.response;

import com.academy.entity.Ebook;
import com.academy.entity.enums.EbookStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Shop / library view of an ebook.
 *
 * Never carries a file path or URL — the PDF is reachable only through the
 * ownership-checked streaming endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EbookResponse {
    private UUID id;
    private String slug;
    private String title;
    private String titleEn;
    private String titleFr;
    private String titleAr;
    private String subtitle;
    private String description;
    private String descriptionEn;
    private String descriptionFr;
    private String descriptionAr;
    private String coverUrl;
    private BigDecimal price;
    private String currency;
    private Integer pageCount;
    private EbookStatus status;
    private Integer purchaseCount;

    /** Language editions available for this title, e.g. ["fr","ar"]. */
    private List<String> languages;

    /** True when the current user already owns it (drives Buy vs Read). */
    private Boolean isOwned;
    private LocalDateTime purchasedAt;

    public static EbookResponse fromEntity(Ebook e) {
        List<String> langs = new ArrayList<>();
        if (e.getPdfEn() != null && !e.getPdfEn().isBlank()) langs.add("en");
        if (e.getPdfFr() != null && !e.getPdfFr().isBlank()) langs.add("fr");
        if (e.getPdfAr() != null && !e.getPdfAr().isBlank()) langs.add("ar");

        return EbookResponse.builder()
                .id(e.getId())
                .slug(e.getSlug())
                .title(e.getTitle())
                .titleEn(e.getTitleEn())
                .titleFr(e.getTitleFr())
                .titleAr(e.getTitleAr())
                .subtitle(e.getSubtitle())
                .description(e.getDescription())
                .descriptionEn(e.getDescriptionEn())
                .descriptionFr(e.getDescriptionFr())
                .descriptionAr(e.getDescriptionAr())
                .coverUrl(e.getCoverUrl())
                .price(e.getPrice())
                .currency(e.getCurrency())
                .pageCount(e.getPageCount())
                .status(e.getStatus())
                .purchaseCount(e.getPurchaseCount())
                .languages(langs)
                .isOwned(false)
                .build();
    }
}
