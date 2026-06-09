package com.academy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private UUID parentCommentId;

    /** Optional achievement to attach — only allowed for CHALLENGE posts, one per user. */
    private String achievementText;

    /** Icon identifier for the achievement (e.g. emoji or icon key). */
    private String achievementIcon;

    /** URL of an uploaded image or PDF file attached to the achievement. */
    private String achievementFileUrl;
}
