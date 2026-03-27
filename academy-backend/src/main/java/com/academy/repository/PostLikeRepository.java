package com.academy.repository;

import com.academy.entity.CommunityPost;
import com.academy.entity.PostLike;
import com.academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    Optional<PostLike> findByUserAndPost(User user, CommunityPost post);

    boolean existsByUserAndPost(User user, CommunityPost post);

    void deleteByUserAndPost(User user, CommunityPost post);

    long countByPost(CommunityPost post);
}
