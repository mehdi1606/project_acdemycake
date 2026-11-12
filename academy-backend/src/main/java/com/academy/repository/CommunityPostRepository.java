package com.academy.repository;

import com.academy.entity.CommunityPost;
import com.academy.entity.User;
import com.academy.entity.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {

    /** Atomic counter changes (no lost updates when people like/comment at the same time). */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE CommunityPost p SET p.likesCount = CASE WHEN COALESCE(p.likesCount, 0) + :d < 0 THEN 0 ELSE COALESCE(p.likesCount, 0) + :d END WHERE p.id = :id")
    int addLikes(@Param("id") UUID id, @Param("d") int delta);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE CommunityPost p SET p.commentsCount = CASE WHEN COALESCE(p.commentsCount, 0) + :d < 0 THEN 0 ELSE COALESCE(p.commentsCount, 0) + :d END WHERE p.id = :id")
    int addComments(@Param("id") UUID id, @Param("d") int delta);

    Page<CommunityPost> findByIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    Page<CommunityPost> findByPostTypeAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(PostType postType, Pageable pageable);

    Page<CommunityPost> findByUserAndIsDeletedFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<CommunityPost> findByUserAndPostTypeAndIsDeletedFalseOrderByCreatedAtDesc(User user, PostType postType, Pageable pageable);

    @Query("SELECT p FROM CommunityPost p WHERE p.isDeleted = false AND p.isPinned = true ORDER BY p.createdAt DESC")
    Page<CommunityPost> findPinnedPosts(Pageable pageable);

    @Query("SELECT p FROM CommunityPost p WHERE p.isDeleted = false AND " +
            "(LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<CommunityPost> searchPosts(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM CommunityPost p WHERE p.isFlagged = true AND p.isDeleted = false ORDER BY p.createdAt DESC")
    Page<CommunityPost> findFlaggedPosts(Pageable pageable);

    @Query("SELECT COUNT(p) FROM CommunityPost p WHERE p.isDeleted = false")
    long countActivePosts();
}
