package com.academy.service.impl;

import com.academy.dto.ChallengeDtos.*;
import com.academy.entity.*;
import com.academy.entity.enums.NotificationType;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.*;
import com.academy.service.FileStorageService;
import com.academy.service.NotificationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Cake challenge rules, all decided here on the server:
 * registration and entries until the submission deadline (students only, verified email),
 * one entry per student with 3-5 photos, admin approval before anything is public,
 * votes only during the voting window, one vote per account per cake, never for your own cake,
 * students count 1 point and staff 10 (one role per account, so a staff vote never counts twice).
 * Live ranking by total points; a cake needs votes from at least min_voters accounts to win.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeService {

    private static final ZoneId MOROCCO = ZoneId.of("Africa/Casablanca");
    private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/jpg", "image/webp");
    private static final long MAX_PHOTO_BYTES = 12L * 1024 * 1024;
    private static final Set<String> ADMIN_STATUSES = Set.of(
            ChallengeEntry.PENDING, ChallengeEntry.APPROVED, ChallengeEntry.CHANGES_REQUESTED,
            ChallengeEntry.REJECTED, ChallengeEntry.DISQUALIFIED);

    private final ChallengeRepository challenges;
    private final ChallengeRegistrationRepository registrations;
    private final ChallengeEntryRepository entries;
    private final ChallengeVoteRepository votes;
    private final FileStorageService files;
    private final NotificationService notifications;
    private final ObjectMapper json;

    // ── lookups ────────────────────────────────────────────────────────────────

    public Challenge bySlug(String slug) {
        return challenges.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found"));
    }

    @Transactional(readOnly = true)
    public Optional<ChallengeView> current() {
        return challenges.findFirstByActiveTrueAndBannerUntilAfterOrderBySubmissionsOpenAtDesc(Instant.now())
                .map(this::view);
    }

    @Transactional(readOnly = true)
    public ChallengeView view(String slug) {
        return view(bySlug(slug));
    }

    private ChallengeView view(Challenge c) {
        Instant now = Instant.now();
        return new ChallengeView(c.getSlug(), c.getActive() ? c.phaseAt(now) : "CLOSED", now,
                c.getSubmissionsOpenAt(), c.getSubmissionsCloseAt(), c.getVotingOpenAt(), c.getVotingCloseAt(),
                c.getResultsAt(), c.getBannerUntil(), c.getMinPhotos(), c.getMaxPhotos(), c.getMinVoters(),
                registrations.countByChallengeId(c.getId()),
                entries.countByChallengeIdAndStatus(c.getId(), ChallengeEntry.APPROVED),
                votes.countVotes(c.getId()), votes.countVoters(c.getId()));
    }

    private String phase(Challenge c) {
        return c.getActive() ? c.phaseAt(Instant.now()) : "CLOSED";
    }

    // ── public gallery + live ranking ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EntryCard> gallery(String slug) {
        Challenge c = bySlug(slug);
        Map<UUID, long[]> score = tally(c);
        List<ChallengeEntry> approved = entries.findByChallengeIdAndStatus(c.getId(), ChallengeEntry.APPROVED);
        Map<UUID, Integer> rank = ranks(approved, score);
        return approved.stream()
                .sorted(byScore(score))
                .map(e -> {
                    long[] s = score.getOrDefault(e.getId(), new long[]{0, 0});
                    return new EntryCard(e.getId(), e.getTitle(), e.getDescription(), photos(e),
                            displayName(e.getUser()), e.getUser().getAvatarUrl(),
                            s[0], s[1], rank.getOrDefault(e.getId(), 0), s[1] >= c.getMinVoters(), e.getReviewedAt(),
                            e.getUser().getId());
                })
                .toList();
    }

    /** One approved cake (for its own page), with its live score and rank. */
    @Transactional(readOnly = true)
    public EntryCard entry(String slug, UUID entryId) {
        return gallery(slug).stream().filter(e -> e.id().equals(entryId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cake not found"));
    }

    /**
     * A tiny page for link previews (WhatsApp, Facebook, X...): crawlers read the
     * Open Graph tags (the cake's photo and name), people are sent on to the cake page.
     */
    @Transactional(readOnly = true)
    public String sharePage(String slug, UUID entryId, String site) {
        String target, title, text, image;
        if (entryId == null) {
            target = site + "/challenge";
            title = "The New Year Cake Challenge 2027 — SARALÖWE Academy";
            text = "One tier. One night of celebration. Enter, vote and discover the most beautiful cakes of the academy.";
            image = site + "/assets/challenge/film-poster.jpg";
        } else {
            EntryCard e = entry(slug, entryId);
            target = site + "/challenge/cake/" + e.id();
            title = e.title() + " — vote for this cake";
            text = "By " + e.authorName() + " · The New Year Cake Challenge 2027 at SARALÖWE Academy. One vote can make the difference.";
            image = e.photos().isEmpty() ? site + "/assets/challenge/film-poster.jpg" : e.photos().get(0);
        }
        return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
                + "<title>" + esc(title) + "</title>"
                + "<meta name=\"description\" content=\"" + esc(text) + "\">"
                + "<meta property=\"og:type\" content=\"website\">"
                + "<meta property=\"og:site_name\" content=\"SARALÖWE Academy\">"
                + "<meta property=\"og:title\" content=\"" + esc(title) + "\">"
                + "<meta property=\"og:description\" content=\"" + esc(text) + "\">"
                + "<meta property=\"og:image\" content=\"" + esc(image) + "\">"
                + "<meta property=\"og:url\" content=\"" + esc(target) + "\">"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\">"
                + "<meta http-equiv=\"refresh\" content=\"0; url=" + esc(target) + "\">"
                + "<link rel=\"canonical\" href=\"" + esc(target) + "\">"
                + "</head><body style=\"background:#1d0812;color:#F3D58E;font-family:Georgia,serif;text-align:center;padding-top:20vh\">"
                + "<p><a style=\"color:#F3D58E\" href=\"" + esc(target) + "\">" + esc(title) + "</a></p>"
                + "<script>location.replace(" + jsStr(target) + ")</script></body></html>";
    }

    private static String esc(String v) {
        return v == null ? "" : v.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static String jsStr(String v) {
        return "\"" + (v == null ? "" : v.replace("\\", "\\\\").replace("\"", "\\\"").replace("<", "\u003c")) + "\"";
    }

    private Map<UUID, long[]> tally(Challenge c) {
        Map<UUID, long[]> m = new HashMap<>();
        for (Object[] row : votes.tally(c.getId())) {
            m.put((UUID) row[0], new long[]{((Number) row[1]).longValue(), ((Number) row[2]).longValue()});
        }
        return m;
    }

    private static Comparator<ChallengeEntry> byScore(Map<UUID, long[]> score) {
        return Comparator.<ChallengeEntry>comparingLong(e -> -score.getOrDefault(e.getId(), new long[]{0, 0})[0])
                .thenComparing(ChallengeEntry::getCreatedAt);
    }

    /** Dense "competition" ranking: equal points share a rank (ties go to the jury). */
    private static Map<UUID, Integer> ranks(List<ChallengeEntry> list, Map<UUID, long[]> score) {
        List<ChallengeEntry> sorted = list.stream().sorted(byScore(score)).toList();
        Map<UUID, Integer> r = new HashMap<>();
        long prev = Long.MIN_VALUE;
        int rank = 0;
        for (int i = 0; i < sorted.size(); i++) {
            long p = score.getOrDefault(sorted.get(i).getId(), new long[]{0, 0})[0];
            if (p != prev) { rank = i + 1; prev = p; }
            r.put(sorted.get(i).getId(), rank);
        }
        return r;
    }

    // ── the signed-in student ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MyStatus me(String slug, User user) {
        Challenge c = bySlug(slug);
        boolean registered = registrations.existsByChallengeIdAndUserId(c.getId(), user.getId());
        MyEntry mine = entries.findByChallengeIdAndUserId(c.getId(), user.getId()).map(this::myEntry).orElse(null);
        return new MyStatus(registered, Boolean.TRUE.equals(user.getIsEmailVerified()), user.getRole().name(),
                user.getRole() == UserRole.STUDENT, mine, votes.votedEntryIds(user.getId(), c.getId()));
    }

    @Transactional
    public MyStatus register(String slug, User user) {
        Challenge c = bySlug(slug);
        mustBeStudentWithVerifiedEmail(user);
        String p = phase(c);
        if (!p.equals("UPCOMING") && !p.equals("SUBMISSIONS")) {
            throw new BadRequestException("Registration is closed for this challenge.");
        }
        if (!registrations.existsByChallengeIdAndUserId(c.getId(), user.getId())) {
            ChallengeRegistration r = new ChallengeRegistration();
            r.setChallenge(c);
            r.setUser(user);
            try {
                registrations.saveAndFlush(r);
            } catch (DataIntegrityViolationException ignored) { /* double click: already registered */ }
        }
        return me(slug, user);
    }

    public String uploadPhoto(String slug, User user, MultipartFile file) {
        Challenge c = bySlug(slug);
        mustBeOpenForEntries(c, user);
        if (file == null || file.isEmpty()) throw new BadRequestException("Choose a photo to upload.");
        if (file.getContentType() == null || !IMAGE_TYPES.contains(file.getContentType().toLowerCase())) {
            throw new BadRequestException("Photos must be JPG, PNG or WebP.");
        }
        if (file.getSize() > MAX_PHOTO_BYTES) throw new BadRequestException("Each photo must be 12 MB or less.");
        return files.getFileUrl(files.storeFile(file, "challenge"));
    }

    @Transactional
    public MyStatus saveEntry(String slug, User user, SaveEntryRequest req) {
        Challenge c = bySlug(slug);
        mustBeOpenForEntries(c, user);

        String title = req.title() == null ? "" : req.title().trim();
        if (title.length() < 2 || title.length() > 120) throw new BadRequestException("Give your cake a name (2 to 120 characters).");
        String desc = req.description() == null ? null : req.description().trim();
        if (desc != null && desc.length() > 1000) throw new BadRequestException("The description can be 1000 characters at most.");
        List<String> photos = req.photos() == null ? List.of() : req.photos().stream()
                .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
        if (photos.size() < c.getMinPhotos() || photos.size() > c.getMaxPhotos()) {
            throw new BadRequestException("Upload between " + c.getMinPhotos() + " and " + c.getMaxPhotos() + " photos.");
        }
        if (photos.stream().anyMatch(u -> !u.contains("/files/challenge/"))) {
            throw new BadRequestException("Photos must be uploaded through the challenge page.");
        }
        if (!Boolean.TRUE.equals(req.certified())) throw new BadRequestException("Please certify that you made and decorated this cake yourself.");
        if (!Boolean.TRUE.equals(req.publicationConsent())) throw new BadRequestException("Please accept the publication of your photos in the academy.");

        ChallengeEntry e = entries.findByChallengeIdAndUserId(c.getId(), user.getId()).orElseGet(() -> {
            ChallengeEntry n = new ChallengeEntry();
            n.setChallenge(c);
            n.setUser(user);
            return n;
        });
        if (ChallengeEntry.REJECTED.equals(e.getStatus()) || ChallengeEntry.DISQUALIFIED.equals(e.getStatus())) {
            throw new ForbiddenException("This entry can no longer be changed.");
        }
        e.setTitle(title);
        e.setDescription(desc == null || desc.isEmpty() ? null : desc);
        e.setPhotosJson(writePhotos(photos));
        e.setCertified(true);
        e.setPublicationConsent(true);
        e.setStatus(ChallengeEntry.PENDING); // every change is checked again before it is public
        entries.save(e);
        return me(slug, user);
    }

    @Transactional
    public List<UUID> vote(String slug, UUID entryId, User user, String ip) {
        Challenge c = bySlug(slug);
        if (!phase(c).equals("VOTING")) throw new BadRequestException("Voting is not open right now.");
        if (!Boolean.TRUE.equals(user.getIsEmailVerified())) throw new ForbiddenException("Confirm your email address to vote.");
        if (Boolean.TRUE.equals(user.getIsBanned())) throw new ForbiddenException("This account cannot vote.");
        ChallengeEntry e = entries.findById(entryId)
                .filter(x -> x.getChallenge().getId().equals(c.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Cake not found"));
        if (!ChallengeEntry.APPROVED.equals(e.getStatus())) throw new BadRequestException("This cake is not open for votes.");
        if (e.getUser().getId().equals(user.getId())) throw new ForbiddenException("You cannot vote for your own cake.");

        Optional<ChallengeVote> existing = votes.findByEntryIdAndVoterId(entryId, user.getId());
        if (existing.isPresent()) {
            if (Boolean.TRUE.equals(existing.get().getVoided())) throw new ForbiddenException("Your vote for this cake was removed by the academy.");
            return votes.votedEntryIds(user.getId(), c.getId()); // already voted: nothing to do
        }
        ChallengeVote v = new ChallengeVote();
        v.setEntry(e);
        v.setVoter(user);
        v.setVoterRole(user.getRole().name());
        v.setPoints(user.getRole() == UserRole.STUDENT ? 1 : 10);
        v.setIpAddress(ip == null ? null : ip.substring(0, Math.min(ip.length(), 64)));
        try {
            votes.saveAndFlush(v);
        } catch (DataIntegrityViolationException ignored) { /* two clicks at once */ }
        return votes.votedEntryIds(user.getId(), c.getId());
    }

    @Transactional
    public List<UUID> unvote(String slug, UUID entryId, User user) {
        Challenge c = bySlug(slug);
        if (!phase(c).equals("VOTING")) throw new BadRequestException("Voting is not open right now.");
        votes.findByEntryIdAndVoterId(entryId, user.getId())
                .filter(v -> !Boolean.TRUE.equals(v.getVoided()))
                .ifPresent(votes::delete);
        return votes.votedEntryIds(user.getId(), c.getId());
    }

    private void mustBeStudentWithVerifiedEmail(User user) {
        if (user.getRole() != UserRole.STUDENT) throw new ForbiddenException("The challenge is for students; staff take part by voting.");
        if (!Boolean.TRUE.equals(user.getIsEmailVerified())) throw new ForbiddenException("Confirm your email address to take part.");
        if (Boolean.TRUE.equals(user.getIsBanned())) throw new ForbiddenException("This account cannot take part.");
    }

    private void mustBeOpenForEntries(Challenge c, User user) {
        mustBeStudentWithVerifiedEmail(user);
        if (!phase(c).equals("SUBMISSIONS")) throw new BadRequestException("Submissions are closed.");
        if (!registrations.existsByChallengeIdAndUserId(c.getId(), user.getId())) {
            throw new BadRequestException("Register for the challenge first.");
        }
    }

    // ── admin ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminEntry> adminEntries(String slug) {
        Challenge c = bySlug(slug);
        Map<UUID, long[]> score = tally(c);
        List<ChallengeEntry> all = entries.findByChallengeIdOrderByCreatedAtAsc(c.getId());
        Map<UUID, Integer> rank = ranks(all.stream().filter(e -> ChallengeEntry.APPROVED.equals(e.getStatus())).toList(), score);
        LocalDateTime opened = LocalDateTime.ofInstant(c.getSubmissionsOpenAt(), ZoneId.systemDefault());
        return all.stream().sorted(byScore(score)).map(e -> {
            long[] s = score.getOrDefault(e.getId(), new long[]{0, 0});
            long flagged = votes.findByEntryIdOrderByCreatedAtDesc(e.getId()).stream()
                    .filter(v -> !Boolean.TRUE.equals(v.getVoided()) && v.getVoter().getCreatedAt() != null
                            && v.getVoter().getCreatedAt().isAfter(opened))
                    .count();
            User u = e.getUser();
            return new AdminEntry(e.getId(), e.getTitle(), e.getDescription(), photos(e),
                    e.getCertified(), e.getPublicationConsent(), e.getStatus(), e.getAdminNote(),
                    e.getCreatedAt(), e.getUpdatedAt(), u.getId(), displayName(u), u.getEmail(), u.getCreatedAt(),
                    s[0], s[1], rank.getOrDefault(e.getId(), 0), flagged);
        }).toList();
    }

    @Transactional
    public AdminEntry setStatus(String slug, UUID entryId, StatusRequest req, User admin) {
        Challenge c = bySlug(slug);
        String status = req.status() == null ? "" : req.status().trim().toUpperCase(Locale.ROOT);
        if (!ADMIN_STATUSES.contains(status)) throw new BadRequestException("Unknown status");
        ChallengeEntry e = entries.findById(entryId)
                .filter(x -> x.getChallenge().getId().equals(c.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));
        String note = req.note() == null || req.note().isBlank() ? null : req.note().trim();
        e.setStatus(status);
        e.setAdminNote(note);
        e.setReviewedAt(LocalDateTime.now());
        e.setReviewedBy(admin.getId());
        entries.save(e);
        notifyStudent(e, status, note);
        return adminEntries(slug).stream().filter(a -> a.id().equals(entryId)).findFirst().orElseThrow();
    }

    private void notifyStudent(ChallengeEntry e, String status, String note) {
        String title;
        String msg;
        switch (status) {
            case ChallengeEntry.APPROVED -> { title = "Your cake is in the gallery"; msg = "Your New Year cake was approved and is now in the challenge gallery."; }
            case ChallengeEntry.CHANGES_REQUESTED -> { title = "The academy asks for a change"; msg = note != null ? note : "Please update your challenge entry."; }
            case ChallengeEntry.REJECTED -> { title = "Your challenge entry was not accepted"; msg = note != null ? note : "Your entry does not meet the challenge rules."; }
            case ChallengeEntry.DISQUALIFIED -> { title = "Your challenge entry was disqualified"; msg = note != null ? note : "Your entry breaks the challenge rules."; }
            default -> { return; }
        }
        try {
            notifications.createNotification(e.getUser(), title, msg, NotificationType.SYSTEM, "/challenge");
        } catch (Exception ex) {
            log.warn("Could not notify challenge entrant {}: {}", e.getUser().getId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AdminVote> adminVotes(String slug, UUID entryId) {
        Challenge c = bySlug(slug);
        LocalDateTime opened = LocalDateTime.ofInstant(c.getSubmissionsOpenAt(), ZoneId.systemDefault());
        List<ChallengeVote> list = votes.findByEntryIdOrderByCreatedAtDesc(entryId);
        Map<String, Long> perIp = list.stream().filter(v -> v.getIpAddress() != null)
                .collect(Collectors.groupingBy(ChallengeVote::getIpAddress, Collectors.counting()));
        return list.stream().map(v -> {
            User u = v.getVoter();
            return new AdminVote(v.getId(), displayName(u), u.getEmail(), v.getVoterRole(), v.getPoints(),
                    u.getCreatedAt(), u.getCreatedAt() != null && u.getCreatedAt().isAfter(opened),
                    Boolean.TRUE.equals(u.getIsEmailVerified()), v.getIpAddress(),
                    v.getIpAddress() == null ? 0 : perIp.getOrDefault(v.getIpAddress(), 0L),
                    Boolean.TRUE.equals(v.getVoided()), v.getVoidedReason(), v.getCreatedAt());
        }).toList();
    }

    @Transactional
    public void voidVote(UUID voteId, VoidRequest req) {
        ChallengeVote v = votes.findById(voteId).orElseThrow(() -> new ResourceNotFoundException("Vote not found"));
        boolean voided = Boolean.TRUE.equals(req.voided());
        v.setVoided(voided);
        v.setVoidedReason(voided && req.reason() != null ? req.reason().trim().substring(0, Math.min(req.reason().trim().length(), 300)) : null);
        votes.save(v);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private MyEntry myEntry(ChallengeEntry e) {
        return new MyEntry(e.getId(), e.getTitle(), e.getDescription(), photos(e), e.getCertified(),
                e.getPublicationConsent(), e.getStatus(), e.getAdminNote(), e.getUpdatedAt());
    }

    private List<String> photos(ChallengeEntry e) {
        try {
            return json.readValue(e.getPhotosJson(), new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String writePhotos(List<String> photos) {
        try {
            return json.writeValueAsString(photos);
        } catch (Exception ex) {
            throw new BadRequestException("Could not save the photos.");
        }
    }

    private static String displayName(User u) {
        return u.getFullName() == null || u.getFullName().isBlank() ? "Student" : u.getFullName().trim();
    }

    /** Morocco wall-clock, for messages. */
    public static ZoneId morocco() {
        return MOROCCO;
    }
}
