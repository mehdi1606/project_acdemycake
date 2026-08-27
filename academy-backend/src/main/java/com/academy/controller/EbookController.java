package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.EbookResponse;
import com.academy.service.EbookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ebooks")
@RequiredArgsConstructor
@Tag(name = "Ebooks", description = "Paid digital books — no subscription required")
public class EbookController {

    private final EbookService ebookService;

    // ── Public shop ──────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List published ebooks")
    public ResponseEntity<ApiResponse<List<EbookResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(ebookService.getPublishedEbooks()));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get one ebook by slug")
    public ResponseEntity<ApiResponse<EbookResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(ebookService.getBySlug(slug)));
    }

    // ── Owner-only ───────────────────────────────────────────────────────────

    @GetMapping("/my-library")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Ebooks the signed-in user has bought")
    public ResponseEntity<ApiResponse<List<EbookResponse>>> myLibrary() {
        return ResponseEntity.ok(ApiResponse.success(ebookService.getMyLibrary()));
    }

    /**
     * Streams the PDF inline for the in-app reader. Requires ownership.
     * The file path is never exposed, so the link cannot be shared to bypass payment.
     */
    @GetMapping("/{id}/content")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Read an owned ebook (inline PDF)")
    public ResponseEntity<Resource> read(@PathVariable UUID id,
                                         @RequestParam(required = false) String language) {
        Resource file = ebookService.getEbookContent(id, language, false);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(file);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download an owned ebook")
    public ResponseEntity<Resource> download(@PathVariable UUID id,
                                             @RequestParam(required = false) String language) {
        Resource file = ebookService.getEbookContent(id, language, true);
        String name = file.getFilename() != null ? file.getFilename() : "ebook.pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(file);
    }
}
