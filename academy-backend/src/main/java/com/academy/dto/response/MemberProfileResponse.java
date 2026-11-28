package com.academy.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** What signed-in members see on another member's profile. No email, phone or marks. */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MemberProfileResponse {

    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String role;
    private LocalDateTime memberSince;

    /** 1-7 student ladder, 8 instructor, 9 admin. */
    private int badgeId;
    /** False while a new student is still working on Apprentice. */
    private boolean badgeEarned;
    private Integer nextBadgeId;
    private Integer nextBadgePercent;
    private List<Check> nextBadgeChecks;

    private int completedCourses;
    private int certificates;
    private int masterclasses;
    private int communityPosts;

    private Challenge challenge;

    private String instagram;
    private String tiktok;

    /** The viewer is looking at their own profile. */
    private boolean me;

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Check {
        private String kind;
        /** Null for score requirements: marks stay private. */
        private Integer have;
        private Integer need;
        private boolean met;
    }

    @Getter
    @Builder
    public static class Challenge {
        private String slug;
        private boolean registered;
    }
}
