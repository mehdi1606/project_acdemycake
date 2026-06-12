package com.academy.dto.response;

import com.academy.entity.CommunityPost;
import com.academy.entity.enums.PostType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String userAvatar;
    private String userRole;
    private String title;
    private String content;
    private List<String> images;
    private PostType postType;
    private Boolean isPinned;
    private Integer likesCount;
    private Integer commentsCount;
    private Integer viewsCount;
    private Boolean isEdited;
    private Boolean isLikedByCurrentUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String achievementText;
    private String achievementIcon;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static PostResponse fromEntity(CommunityPost post) {
        return fromEntity(post, false);
    }

    public static PostResponse fromEntity(CommunityPost post, boolean isLikedByCurrentUser) {
        List<String> images = null;
        if (post.getImagesJson() != null) {
            try {
                images = objectMapper.readValue(post.getImagesJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                // ignore
            }
        }

        // The author may be a soft-deleted user (filtered out by @SQLRestriction) → null.
        var author = post.getUser();
        return PostResponse.builder()
                .id(post.getId())
                .userId(author != null ? author.getId() : null)
                .userName(author != null ? author.getFullName() : "Deleted User")
                .userAvatar(author != null ? author.getAvatarUrl() : null)
                .userRole(author != null && author.getRole() != null ? author.getRole().name() : null)
                .title(post.getTitle())
                .content(post.getContent())
                .images(images)
                .postType(post.getPostType())
                .isPinned(post.getIsPinned())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .viewsCount(post.getViewsCount())
                .isEdited(post.getIsEdited())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .achievementText(post.getAchievementText())
                .achievementIcon(post.getAchievementIcon())
                .build();
    }
}
