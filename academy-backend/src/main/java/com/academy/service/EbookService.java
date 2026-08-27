package com.academy.service;

import com.academy.dto.response.EbookResponse;
import com.academy.entity.Ebook;
import com.academy.entity.User;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.UUID;

public interface EbookService {

    /** Published ebooks for the shop, flagged with ownership for the current user. */
    List<EbookResponse> getPublishedEbooks();

    EbookResponse getBySlug(String slug);

    Ebook findById(UUID id);

    /** Ebooks the current user has paid for. */
    List<EbookResponse> getMyLibrary();

    boolean userOwns(User user, Ebook ebook);

    /**
     * The PDF bytes for one language edition, but only if the caller owns the book.
     * Throws ForbiddenException otherwise — this is the paywall.
     */
    Resource getEbookContent(UUID ebookId, String language, boolean countAsDownload);

    /** Recorded after a COMPLETED payment: grants access and notifies the buyer. */
    void grantPurchase(User user, UUID ebookId, String orderId,
                       java.math.BigDecimal amount, String currency);
}
