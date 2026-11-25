package com.academy.controller;

import com.academy.dto.ChallengeDtos.*;
import com.academy.dto.response.ApiResponse;
import com.academy.entity.User;
import com.academy.security.RateLimitingFilter;
import com.academy.security.UserPrincipal;
import com.academy.service.UserService;
import com.academy.service.impl.ChallengeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/** Cake challenge: public summary and gallery, the student's own actions, and admin moderation. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Challenges", description = "Student cake challenges")
public class ChallengeController {

    private final ChallengeService service;
    private final UserService users;

    // ── public (no sign-in) ────────────────────────────────────────────────────

    /** The challenge currently advertised across the site, or null when there is none. */
    @GetMapping("/api/v1/public/challenges/current")
    public ResponseEntity<ApiResponse<ChallengeView>> current() {
        return ResponseEntity.ok(ApiResponse.success(service.current().orElse(null)));
    }

    @GetMapping("/api/v1/public/challenges/{slug}")
    public ResponseEntity<ApiResponse<ChallengeView>> view(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(service.view(slug)));
    }

    /** Approved cakes with their live score and rank. */
    @GetMapping("/api/v1/public/challenges/{slug}/entries")
    public ResponseEntity<ApiResponse<List<EntryCard>>> gallery(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(service.gallery(slug)));
    }

    // ── signed-in ──────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/challenges/{slug}/me")
    public ResponseEntity<ApiResponse<MyStatus>> me(@PathVariable String slug, @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success(service.me(slug, user(p))));
    }

    @PostMapping("/api/v1/challenges/{slug}/register")
    public ResponseEntity<ApiResponse<MyStatus>> register(@PathVariable String slug, @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success("Registered", service.register(slug, user(p))));
    }

    @PostMapping("/api/v1/challenges/{slug}/photos")
    public ResponseEntity<ApiResponse<String>> upload(@PathVariable String slug, @RequestParam("file") MultipartFile file,
                                                      @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", service.uploadPhoto(slug, user(p), file)));
    }

    @PutMapping("/api/v1/challenges/{slug}/entry")
    public ResponseEntity<ApiResponse<MyStatus>> save(@PathVariable String slug, @RequestBody SaveEntryRequest body,
                                                      @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success("Entry saved", service.saveEntry(slug, user(p), body)));
    }

    @PostMapping("/api/v1/challenges/{slug}/entries/{entryId}/vote")
    public ResponseEntity<ApiResponse<List<UUID>>> vote(@PathVariable String slug, @PathVariable UUID entryId,
                                                        @AuthenticationPrincipal UserPrincipal p, HttpServletRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.vote(slug, entryId, user(p), RateLimitingFilter.clientIp(req))));
    }

    @DeleteMapping("/api/v1/challenges/{slug}/entries/{entryId}/vote")
    public ResponseEntity<ApiResponse<List<UUID>>> unvote(@PathVariable String slug, @PathVariable UUID entryId,
                                                          @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success(service.unvote(slug, entryId, user(p))));
    }

    // ── admin (secured by /api/v1/admin/** -> ADMIN) ───────────────────────────

    @GetMapping("/api/v1/admin/challenges/{slug}/entries")
    public ResponseEntity<ApiResponse<List<AdminEntry>>> adminEntries(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(service.adminEntries(slug)));
    }

    @PutMapping("/api/v1/admin/challenges/{slug}/entries/{entryId}/status")
    public ResponseEntity<ApiResponse<AdminEntry>> setStatus(@PathVariable String slug, @PathVariable UUID entryId,
                                                             @RequestBody StatusRequest body,
                                                             @AuthenticationPrincipal UserPrincipal p) {
        return ResponseEntity.ok(ApiResponse.success(service.setStatus(slug, entryId, body, user(p))));
    }

    @GetMapping("/api/v1/admin/challenges/{slug}/entries/{entryId}/votes")
    public ResponseEntity<ApiResponse<List<AdminVote>>> adminVotes(@PathVariable String slug, @PathVariable UUID entryId) {
        return ResponseEntity.ok(ApiResponse.success(service.adminVotes(slug, entryId)));
    }

    @PutMapping("/api/v1/admin/challenges/votes/{voteId}")
    public ResponseEntity<ApiResponse<Void>> voidVote(@PathVariable UUID voteId, @RequestBody VoidRequest body) {
        service.voidVote(voteId, body);
        return ResponseEntity.ok(ApiResponse.success("Saved"));
    }

    private User user(UserPrincipal p) {
        return users.findById(p.getId());
    }
}
