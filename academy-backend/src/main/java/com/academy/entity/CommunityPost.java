package com.academy.entity;

import com.academy.entity.enums.PostType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "community_posts", indexes = {
        @Index(name = "idx_community_posts_user_id", columnList = "user_id"),
        @Index(name = "idx_community_posts_post_type", columnList = "post_type"),
        @Index(name = "idx_community_posts_is_pinned", columnList = "is_pinned"),
        @Index(name = "idx_community_posts_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPost extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "images_json", columnDefinition = "TEXT")
    private String imagesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, length = 20)
    @Builder.Default
    private PostType postType = PostType.DISCUSSION;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    @Builder.Default
    private Integer commentsCount = 0;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "is_flagged", nullable = false)
    @Builder.Default
    private Boolean isFlagged = false;

    @Column(name = "flag_reason")
    private String flagReason;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<CommunityComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<PostLike> likes = new HashSet<>();

    public void incrementLikesCount() {
        this.likesCount = (this.likesCount == null ? 0 : this.likesCount) + 1;
    }

    public void decrementLikesCount() {
        this.likesCount = Math.max(0, (this.likesCount == null ? 0 : this.likesCount) - 1);
    }

    public void incrementCommentsCount() {
        this.commentsCount = (this.commentsCount == null ? 0 : this.commentsCount) + 1;
    }

    public void decrementCommentsCount() {
        this.commentsCount = Math.max(0, (this.commentsCount == null ? 0 : this.commentsCount) - 1);
    }

    public void incrementViewsCount() {
        this.viewsCount = (this.viewsCount == null ? 0 : this.viewsCount) + 1;
    }
}
