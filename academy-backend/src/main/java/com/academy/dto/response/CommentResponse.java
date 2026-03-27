package com.academy.dto.response;

import com.academy.entity.CommunityComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private UUID id;
    private UUID postId;
    private UUID userId;
    private String userName;
    private String userAvatar;
    private UUID parentCommentId;
    private String content;
    private Integer likesCount;
    private Boolean isEdited;
    private Boolean isLikedByCurrentUser;
    private List<CommentResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse fromEntity(CommunityComment comment) {
        return fromEntity(comment, false, false);
    }

    public static CommentResponse fromEntity(CommunityComment comment, boolean isLikedByCurrentUser, boolean includeReplies) {
        CommentResponseBuilder builder = CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFullName())
                .userAvatar(comment.getUser().getAvatarUrl())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .content(comment.getContent())
                .likesCount(comment.getLikesCount())
                .isEdited(comment.getIsEdited())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());

        if (includeReplies && comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            builder.replies(comment.getReplies().stream()
                    .filter(r -> !r.getIsDeleted())
                    .map(r -> CommentResponse.fromEntity(r, false, false))
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
