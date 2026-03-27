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

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .userName(post.getUser().getFullName())
                .userAvatar(post.getUser().getAvatarUrl())
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
                .build();
    }
}
