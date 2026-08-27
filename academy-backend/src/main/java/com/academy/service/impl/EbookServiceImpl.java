package com.academy.service.impl;

import com.academy.dto.response.EbookResponse;
import com.academy.entity.Ebook;
import com.academy.entity.EbookPurchase;
import com.academy.entity.User;
import com.academy.entity.enums.EbookStatus;
import com.academy.entity.enums.NotificationType;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.EbookPurchaseRepository;
import com.academy.repository.EbookRepository;
import com.academy.security.UserPrincipal;
import com.academy.service.EbookService;
import com.academy.service.FileStorageService;
import com.academy.service.NotificationService;
import com.academy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EbookServiceImpl implements EbookService {

    private final EbookRepository ebookRepository;
    private final EbookPurchaseRepository purchaseRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final UserService userService;

    @Value("${app.file.ebook-dir}")
    private String ebookDir;

    // ── Shop ─────────────────────────────────────────────────────────────────

    @Override
    public List<EbookResponse> getPublishedEbooks() {
        User current = getCurrentUserOrNull();
        return ebookRepository.findByStatusOrderByDisplayOrderAsc(EbookStatus.PUBLISHED)
                .stream()
                .map(e -> decorate(e, current))
                .toList();
    }

    @Override
    public EbookResponse getBySlug(String slug) {
        Ebook ebook = ebookRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Ebook", "slug", slug));
        return decorate(ebook, getCurrentUserOrNull());
    }

    @Override
    public Ebook findById(UUID id) {
        return ebookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ebook", "id", id));
    }

    // ── Library / ownership ──────────────────────────────────────────────────

    @Override
    public List<EbookResponse> getMyLibrary() {
        User user = getCurrentUser();
        return purchaseRepository.findByUserOrderByPurchasedAtDesc(user)
                .stream()
                .map(p -> {
                    EbookResponse r = EbookResponse.fromEntity(p.getEbook());
                    r.setCoverUrl(fileStorageService.getFileUrl(p.getEbook().getCoverUrl()));
                    r.setIsOwned(true);
                    r.setPurchasedAt(p.getPurchasedAt());
                    return r;
                })
                .toList();
    }

    @Override
    public boolean userOwns(User user, Ebook ebook) {
        return user != null && purchaseRepository.existsByUserAndEbook(user, ebook);
    }

    // ── Secure content delivery ──────────────────────────────────────────────

    @Override
    @Transactional
    public Resource getEbookContent(UUID ebookId, String language, boolean countAsDownload) {
        User user = getCurrentUser();
        Ebook ebook = findById(ebookId);

        // The paywall. Ownership — never a secret URL — is what grants access.
        EbookPurchase purchase = purchaseRepository.findByUserAndEbook(user, ebook)
                .orElseThrow(() -> new ForbiddenException("You have not purchased this ebook"));

        String fileName = ebook.resolvePdf(language);
        if (fileName == null || fileName.isBlank()) {
            throw new ResourceNotFoundException("This ebook has no file for the requested language");
        }

        Path base = Paths.get(ebookDir).toAbsolutePath().normalize();
        Path file = base.resolve(fileName).normalize();

        // Defence in depth: a crafted file name must never escape the ebook directory.
        if (!file.startsWith(base)) {
            log.warn("Blocked path traversal attempt for ebook {} → {}", ebookId, fileName);
            throw new ForbiddenException("Invalid ebook file");
        }
        if (!Files.exists(file) || !Files.isReadable(file)) {
            log.error("Ebook file missing on disk: {}", file);
            throw new ResourceNotFoundException("Ebook file is not available");
        }

        if (countAsDownload) {
            purchase.setDownloadCount((purchase.getDownloadCount() == null ? 0 : purchase.getDownloadCount()) + 1);
            purchaseRepository.save(purchase);
        }

        try {
            return new UrlResource(file.toUri());
        } catch (MalformedURLException e) {
            throw new BadRequestException("Could not read the ebook file");
        }
    }

    // ── Purchase ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void grantPurchase(User user, UUID ebookId, String orderId,
                              BigDecimal amount, String currency) {
        Ebook ebook = findById(ebookId);

        if (purchaseRepository.existsByUserAndEbook(user, ebook)) {
            log.warn("Ebook {} already owned by {} — skipping duplicate grant", ebookId, user.getEmail());
            return;
        }

        purchaseRepository.save(EbookPurchase.builder()
                .user(user)
                .ebook(ebook)
                .orderId(orderId)
                .amountPaid(amount)
                .currency(currency != null ? currency : "MAD")
                .purchasedAt(LocalDateTime.now())
                .build());

        ebook.setPurchaseCount((ebook.getPurchaseCount() == null ? 0 : ebook.getPurchaseCount()) + 1);
        ebookRepository.save(ebook);

        // Tell the buyer in-app (this also pushes over WebSocket).
        notificationService.createNotification(
                user,
                "Your ebook is ready",
                "\"" + ebook.getTitle() + "\" has been added to your library. You can read or download it now.",
                NotificationType.SYSTEM,
                "/student/ebooks"
        );

        log.info("Ebook purchase granted: {} → {} (order {})", ebook.getSlug(), user.getEmail(), orderId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private EbookResponse decorate(Ebook e, User user) {
        EbookResponse r = EbookResponse.fromEntity(e);
        r.setCoverUrl(fileStorageService.getFileUrl(e.getCoverUrl()));
        if (user != null) {
            purchaseRepository.findByUserAndEbook(user, e).ifPresent(p -> {
                r.setIsOwned(true);
                r.setPurchasedAt(p.getPurchasedAt());
            });
        }
        return r;
    }

    private User getCurrentUser() {
        return Optional.ofNullable(getCurrentUserOrNull())
                .orElseThrow(() -> new ForbiddenException("You must be signed in"));
    }

    /** Null for anonymous visitors — the shop listing is public. */
    private User getCurrentUserOrNull() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            if (!(auth.getPrincipal() instanceof UserPrincipal principal)) return null;
            return userService.findById(principal.getId());
        } catch (Exception ignored) {
            return null;
        }
    }
}
