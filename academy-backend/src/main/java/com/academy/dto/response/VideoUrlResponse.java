package com.academy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoUrlResponse {
    private String playbackUrl;
    private String thumbnailUrl;
    private Integer durationSeconds;
    private LocalDateTime expiresAt;
    private String tokenId;
}
