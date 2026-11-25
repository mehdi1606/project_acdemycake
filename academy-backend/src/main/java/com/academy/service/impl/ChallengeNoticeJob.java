package com.academy.service.impl;

import com.academy.entity.Challenge;
import com.academy.entity.ChallengeEntry;
import com.academy.entity.User;
import com.academy.entity.enums.NotificationType;
import com.academy.repository.ChallengeEntryRepository;
import com.academy.repository.ChallengeRepository;
import com.academy.repository.UserRepository;
import com.academy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tells every member, once, when a challenge's voting opens and when its
 * results are out (in-app notification). Entrants with an approved cake get a
 * personal nudge to share it. Runs every 5 minutes; each notice is sent once.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChallengeNoticeJob {

    private final ChallengeRepository challenges;
    private final ChallengeEntryRepository entries;
    private final UserRepository users;
    private final NotificationService notifications;
    private final JdbcTemplate jdbc;

    @Scheduled(initialDelay = 90_000, fixedDelay = 300_000)
    @Transactional
    public void run() {
        Instant now = Instant.now();
        for (Challenge c : challenges.findAll()) {
            if (!Boolean.TRUE.equals(c.getActive())) continue;
            String phase = c.phaseAt(now);
            try {
                if (("VOTING".equals(phase)) && c.getVotingNotifiedAt() == null) {
                    c.setVotingNotifiedAt(now);
                    challenges.save(c);
                    Map<UUID, UUID> mine = entries.findByChallengeIdAndStatus(c.getId(), ChallengeEntry.APPROVED).stream()
                            .collect(Collectors.toMap(e -> e.getUser().getId(), ChallengeEntry::getId, (a, b) -> a));
                    for (User u : members()) {
                        UUID entry = mine.get(u.getId());
                        if (entry != null) {
                            notifications.createNotification(u, "Voting is open: share your cake",
                                    "Voting runs until 1 January. Send your cake's link to your friends and family: every vote counts.",
                                    NotificationType.SYSTEM, "/challenge/cake/" + entry);
                        } else {
                            notifications.createNotification(u, "The New Year Cake Challenge: voting is open",
                                    "Discover the cakes of the academy and vote for your favourites until 1 January.",
                                    NotificationType.SYSTEM, "/challenge");
                        }
                    }
                    log.info("Challenge {}: voting notice sent", c.getSlug());
                }
                if ("RESULTS".equals(phase) && c.getResultsNotifiedAt() == null) {
                    c.setResultsNotifiedAt(now);
                    challenges.save(c);
                    for (User u : members()) {
                        notifications.createNotification(u, "The winners are announced",
                                "Discover the champions of the New Year Cake Challenge 2027.",
                                NotificationType.SYSTEM, "/challenge");
                    }
                    log.info("Challenge {}: results notice sent", c.getSlug());
                }
            } catch (Exception e) {
                log.warn("Challenge notices for {}: {}", c.getSlug(), e.getMessage());
            }
        }
    }

    private List<User> members() {
        List<UUID> ids = jdbc.queryForList(
                "SELECT id FROM users WHERE is_email_verified AND NOT is_deleted AND NOT is_banned", UUID.class);
        return users.findAllById(ids);
    }
}
