package com.academy.repository;

import com.academy.entity.CommunityComment;
import com.academy.entity.CommunityPost;
import com.academy.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, UUID> {

    @Query("SELECT c FROM CommunityComment c WHERE c.post = :post AND c.parentComment IS NULL AND c.isDeleted = false ORDER BY c.createdAt ASC")
    Page<CommunityComment> findTopLevelCommentsByPost(@Param("post") CommunityPost post, Pageable pageable);

    @Query("SELECT c FROM CommunityComment c WHERE c.post = :post AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<CommunityComment> findAllCommentsByPost(@Param("post") CommunityPost post);

    List<CommunityComment> findByParentCommentAndIsDeletedFalse(CommunityComment parentComment);

    Page<CommunityComment> findByUserAndIsDeletedFalse(User user, Pageable pageable);

    long countByPostAndIsDeletedFalse(CommunityPost post);
}
