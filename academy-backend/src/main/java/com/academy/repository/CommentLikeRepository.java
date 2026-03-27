package com.academy.repository;

import com.academy.entity.CommentLike;
import com.academy.entity.CommunityComment;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {

    Optional<CommentLike> findByUserAndComment(User user, CommunityComment comment);

    boolean existsByUserAndComment(User user, CommunityComment comment);

    void deleteByUserAndComment(User user, CommunityComment comment);

    long countByComment(CommunityComment comment);
}
