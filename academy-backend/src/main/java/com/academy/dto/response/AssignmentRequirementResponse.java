package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * One linked course a student still has to finish before an assignment unlocks:
 * no access to it, lessons not completed, or published quizzes not passed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequirementResponse {
    private UUID courseId;
    private String courseTitle;
    private String courseTitleAr;
    private String courseSlug;
    private boolean noAccess;
    private long lessonsLeft;
    private long quizzesLeft;
}
