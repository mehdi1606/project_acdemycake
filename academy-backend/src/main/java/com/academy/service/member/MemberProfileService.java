package com.academy.service.member;

import com.academy.dto.response.MemberProfileResponse;
import com.academy.dto.response.MemberProfileResponse.Check;
import com.academy.dto.response.UserResponse;
import com.academy.entity.Challenge;
import com.academy.entity.User;
import com.academy.entity.enums.UserRole;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.ChallengeRegistrationRepository;
import com.academy.repository.ChallengeRepository;
import com.academy.repository.UserRepository;
import com.academy.service.impl.BadgeStatsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * A member's profile as other signed-in members see it.
 *
 * Never exposed: email, phone, scores. The badge level is worked out here with the
 * same ladder as config/badges.ts, so quiz and assignment marks never leave the server;
 * score requirements are sent as "met / not met" only.
 */
@Service
@RequiredArgsConstructor
public class MemberProfileService {

    private final UserRepository userRepository;
    private final BadgeStatsService badgeStatsService;
    private final ChallengeRepository challengeRepository;
    private final ChallengeRegistrationRepository challengeRegistrationRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    /** Student ladder — keep in step with template/src/config/badges.ts. */
    private record Level(int id, Integer certificates, Integer enrolledCourses, Integer completedLessons, boolean emailVerified,
                         Integer quizAvg, Integer activeWeeks, Integer bestAssignment, Integer avgAssignment,
                         Integer shareOrReview, Integer contributions, Integer masterclasses, Integer days, boolean chefApproval) {}

    private static final List<Level> LADDER = List.of(
            new Level(1, null, 1, 1, true, null, null, null, null, null, null, null, null, false),
            new Level(2, 3, null, null, false, null, null, null, null, null, null, null, 60, false),
            new Level(3, 3, null, null, false, 75, 8, null, null, 10, null, null, 120, false),
            new Level(4, 6, null, null, false, null, null, 90, null, 20, null, null, 180, false),
            new Level(5, 6, null, null, false, 88, null, null, 88, null, null, 2, 270, false),
            new Level(6, 10, null, null, false, null, null, null, 95, null, 50, 3, 365, false),
            new Level(7, 10, null, null, false, null, null, null, 98, null, 100, 5, 730, true)
    );

    @Transactional(readOnly = true)
    public MemberProfileResponse getProfile(UUID memberId, UUID viewerId) {
        User user = userRepository.findById(memberId)
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()) && !Boolean.TRUE.equals(u.getIsBanned()))
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", memberId));

        UserResponse s = badgeStatsService.apply(UserResponse.fromEntity(user));
        UserRole role = user.getRole();

        int badgeId;
        boolean earned;
        Integer nextId = null;
        List<Check> checks = List.of();
        int percent = 100;
        if (role == UserRole.ADMIN) {
            badgeId = 9; earned = true;
        } else if (role == UserRole.INSTRUCTOR) {
            badgeId = 8; earned = true;
        } else {
            int level = 0;
            for (Level l : LADDER) {
                if (!checks(l, s, user).stream().allMatch(Check::isMet)) break;
                level = l.id();
            }
            int floor = Math.min(7, Math.max(0, user.getBadgeFloor() == null ? 0 : user.getBadgeFloor()));
            level = Math.max(level, floor);
            earned = level >= 1;
            badgeId = Math.max(1, level);
            int next = level < 1 ? 1 : (level >= 7 ? 0 : level + 1);
            if (next > 0) {
                nextId = next;
                checks = checks(LADDER.get(next - 1), s, user);
                percent = percent(checks);
            }
        }

        MemberProfileResponse.Challenge challenge = currentChallenge()
                .map(c -> MemberProfileResponse.Challenge.builder()
                        .slug(c.getSlug())
                        .registered(challengeRegistrationRepository.existsByChallengeIdAndUserId(c.getId(), user.getId()))
                        .build())
                .orElse(null);

        JsonNode social = parse(user.getSocialLinks());
        return MemberProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(role.name())
                .memberSince(user.getCreatedAt())
                .badgeId(badgeId)
                .badgeEarned(earned)
                .nextBadgeId(nextId)
                .nextBadgePercent(nextId == null ? null : percent)
                .nextBadgeChecks(checks)
                .completedCourses(nz(s.getCompletedCourses()))
                .certificates(nz(s.getCertificates()))
                .masterclasses(nz(s.getCompletedMasterclasses()))
                .communityPosts(nz(s.getCommunityPosts()))
                .challenge(challenge)
                .instagram(safeLink(social, "instagram", "instagram.com"))
                .tiktok(safeLink(social, "tiktok", "tiktok.com"))
                .me(user.getId().equals(viewerId))
                .build();
    }

    private List<Check> checks(Level l, UserResponse s, User u) {
        List<Check> out = new ArrayList<>();
        if (l.emailVerified()) count(out, "emailVerified", Boolean.TRUE.equals(u.getIsEmailVerified()) ? 1 : 0, 1);
        if (l.enrolledCourses() != null) count(out, "enrolledCourses", nz(s.getEnrolledCourses()), l.enrolledCourses());
        if (l.completedLessons() != null) count(out, "completedLessons", nz(s.getCompletedLessons()), l.completedLessons());
        if (l.certificates() != null) count(out, "certificates", nz(s.getCertificates()), l.certificates());
        if (l.quizAvg() != null) score(out, "quizAvg", s.getAvgQuizScore(), l.quizAvg());
        if (l.activeWeeks() != null) count(out, "activeWeeks", nz(s.getActiveWeeks()), l.activeWeeks());
        if (l.bestAssignment() != null) score(out, "bestAssignment", s.getBestAssignmentScore(), l.bestAssignment());
        if (l.avgAssignment() != null) score(out, "avgAssignment", s.getAvgAssignmentScore(), l.avgAssignment());
        if (l.shareOrReview() != null) count(out, "shareOrReview", nz(s.getCommunityPosts()) + nz(s.getReviews()), l.shareOrReview());
        if (l.contributions() != null) count(out, "contributions", nz(s.getCommunityContributions()), l.contributions());
        if (l.masterclasses() != null) count(out, "masterclasses", nz(s.getCompletedMasterclasses()), l.masterclasses());
        if (l.days() != null) count(out, "days", days(u.getCreatedAt()), l.days());
        if (l.chefApproval()) out.add(Check.builder().kind("chefApproval").met(u.getEliteApprovedAt() != null).build());
        return out;
    }

    private static void count(List<Check> out, String kind, int have, int need) {
        out.add(Check.builder().kind(kind).have(have).need(need).met(have >= need).build());
    }

    /** Marks stay private: only whether the bar is reached, plus the bar itself. */
    private static void score(List<Check> out, String kind, Integer have, int need) {
        out.add(Check.builder().kind(kind).need(need).met(have != null && have >= need).build());
    }

    private static int percent(List<Check> checks) {
        if (checks.isEmpty()) return 100;
        double sum = 0;
        for (Check c : checks) {
            if (c.getHave() != null && c.getNeed() != null && c.getNeed() > 0) {
                sum += Math.min(1.0, (double) c.getHave() / c.getNeed());
            } else {
                sum += c.isMet() ? 1 : 0;
            }
        }
        return (int) Math.round(sum / checks.size() * 100);
    }

    private Optional<Challenge> currentChallenge() {
        return challengeRepository.findFirstByActiveTrueAndBannerUntilAfterOrderBySubmissionsOpenAtDesc(Instant.now());
    }

    private static int days(LocalDateTime since) {
        if (since == null) return 0;
        return (int) Math.max(0, Duration.between(since, LocalDateTime.now()).toDays());
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }

    private JsonNode parse(String json) {
        try {
            return json == null || json.isBlank() ? mapper.createObjectNode() : mapper.readTree(json);
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    /** Only real https links to the expected site (no javascript:, no look-alike domains). */
    static String safeLink(JsonNode social, String key, String domain) {
        String raw = social.path(key).asText("").trim();
        if (raw.isEmpty()) return null;
        if (!raw.toLowerCase(Locale.ROOT).startsWith("http")) raw = "https://" + raw;
        try {
            URI uri = URI.create(raw);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            boolean ok = ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    && (host.equals(domain) || host.endsWith("." + domain));
            return ok ? "https://" + host + (uri.getRawPath() == null ? "" : uri.getRawPath()) : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
