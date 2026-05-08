package com.academy.service.impl;

import com.academy.dto.request.CreateCommentRequest;
import com.academy.dto.request.CreatePostRequest;
import com.academy.dto.response.CommentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PostResponse;
import com.academy.entity.*;
import com.academy.entity.enums.PostType;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.BadRequestException;
import com.academy.exception.ForbiddenException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.*;
import com.academy.security.UserPrincipal;
import com.academy.service.CommunityService;
import com.academy.service.NotificationService;
import com.academy.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityServiceImpl implements CommunityService {

    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override
    public PageResponse<PostResponse> getPosts(int page, int size, PostType postType, String search) {
        User currentUser = getCurrentUser();
        // Reading posts is open to all authenticated users — no subscription gate

        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityPost> postsPage;

        if (search != null && !search.trim().isEmpty()) {
            postsPage = postRepository.searchPosts(search.trim(), pageable);
        } else if (postType != null) {
            postsPage = postRepository.findByPostTypeAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(postType, pageable);
        } else {
            postsPage = postRepository.findByIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(pageable);
        }

        return PageResponse.from(postsPage, post -> {
            boolean isLiked = postLikeRepository.existsByUserAndPost(currentUser, post);
            return PostResponse.fromEntity(post, isLiked);
        });
    }

    @Override
    @Transactional
    public PostResponse getPostById(UUID id) {
        User currentUser = getCurrentUser();
        // Reading a single post is open to all authenticated users

        CommunityPost post = findPostById(id);
        post.incrementViewsCount();
        postRepository.save(post);

        boolean isLiked = postLikeRepository.existsByUserAndPost(currentUser, post);
        return PostResponse.fromEntity(post, isLiked);
    }

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        User currentUser = getCurrentUser();
        verifySubscriptionAccess(currentUser);

        String imagesJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imagesJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                log.error("Error serializing images: {}", e.getMessage());
            }
        }

        CommunityPost post = CommunityPost.builder()
                .user(currentUser)
                .title(request.getTitle())
                .content(request.getContent())
                .imagesJson(imagesJson)
                .postType(request.getPostType() != null ? request.getPostType() : PostType.DISCUSSION)
                .build();

        post = postRepository.save(post);
        log.info("Post created: {} by user: {}", post.getId(), currentUser.getEmail());

        return PostResponse.fromEntity(post, false);
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID id, CreatePostRequest request) {
        User currentUser = getCurrentUser();
        CommunityPost post = findPostById(id);
        verifyOwnerOrAdmin(post.getUser(), currentUser);

        if (request.getTitle() != null) {
            post.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getImageUrls() != null) {
            try {
                post.setImagesJson(objectMapper.writeValueAsString(request.getImageUrls()));
            } catch (JsonProcessingException e) {
                log.error("Error serializing images: {}", e.getMessage());
            }
        }
        if (request.getPostType() != null) {
            post.setPostType(request.getPostType());
        }
        post.setIsEdited(true);

        post = postRepository.save(post);
        log.info("Post updated: {}", post.getId());

        boolean isLiked = postLikeRepository.existsByUserAndPost(currentUser, post);
        return PostResponse.fromEntity(post, isLiked);
    }

    @Override
    @Transactional
    public void deletePost(UUID id) {
        User currentUser = getCurrentUser();
        CommunityPost post = findPostById(id);
        verifyOwnerOrAdmin(post.getUser(), currentUser);

        post.setIsDeleted(true);
        postRepository.save(post);
        log.info("Post deleted: {}", id);
    }

    @Override
    @Transactional
    public void likePost(UUID postId) {
        User currentUser = getCurrentUser();
        verifySubscriptionAccess(currentUser);

        CommunityPost post = findPostById(postId);

        if (postLikeRepository.existsByUserAndPost(currentUser, post)) {
            throw new BadRequestException("You have already liked this post");
        }

        PostLike like = PostLike.builder()
                .user(currentUser)
                .post(post)
                .build();
        postLikeRepository.save(like);

        post.incrementLikesCount();
        postRepository.save(post);

        // Notify post owner
        if (!post.getUser().getId().equals(currentUser.getId())) {
            notificationService.createNotification(
                    post.getUser(),
                    "New Like",
                    currentUser.getFullName() + " liked your post",
                    com.academy.entity.enums.NotificationType.COMMUNITY,
                    "/community/posts/" + postId
            );
        }
    }

    @Override
    @Transactional
    public void unlikePost(UUID postId) {
        User currentUser = getCurrentUser();
        CommunityPost post = findPostById(postId);

        PostLike like = postLikeRepository.findByUserAndPost(currentUser, post)
                .orElseThrow(() -> new BadRequestException("You have not liked this post"));

        postLikeRepository.delete(like);
        post.decrementLikesCount();
        postRepository.save(post);
    }

    @Override
    @Transactional
    public void pinPost(UUID postId) {
        User currentUser = getCurrentUser();
        verifyAdmin(currentUser);

        CommunityPost post = findPostById(postId);
        post.setIsPinned(true);
        postRepository.save(post);
        log.info("Post pinned: {} by admin: {}", postId, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void unpinPost(UUID postId) {
        User currentUser = getCurrentUser();
        verifyAdmin(currentUser);

        CommunityPost post = findPostById(postId);
        post.setIsPinned(false);
        postRepository.save(post);
        log.info("Post unpinned: {} by admin: {}", postId, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void reportPost(UUID postId, String reason) {
        User currentUser = getCurrentUser();
        // Any authenticated user can report a post

        CommunityPost post = findPostById(postId);
        post.setIsFlagged(true);
        post.setFlagReason(reason);
        postRepository.save(post);
        log.info("Post reported: {} by user: {} reason: {}", postId, currentUser.getEmail(), reason);
    }

    @Override
    public PageResponse<CommentResponse> getPostComments(UUID postId, int page, int size) {
        User currentUser = getCurrentUser();
        // Reading comments is open to all authenticated users

        CommunityPost post = findPostById(postId);
        Pageable pageable = PageRequest.of(page, size);

        Page<CommunityComment> commentsPage = commentRepository.findTopLevelCommentsByPost(post, pageable);

        return PageResponse.from(commentsPage, comment -> {
            boolean isLiked = commentLikeRepository.existsByUserAndComment(currentUser, comment);
            return CommentResponse.fromEntity(comment, isLiked, true);
        });
    }

    @Override
    @Transactional
    public CommentResponse createComment(UUID postId, CreateCommentRequest request) {
        User currentUser = getCurrentUser();
        verifySubscriptionAccess(currentUser);

        CommunityPost post = findPostById(postId);

        CommunityComment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = findCommentById(request.getParentCommentId());
            if (!parentComment.getPost().getId().equals(postId)) {
                throw new BadRequestException("Parent comment does not belong to this post");
            }
        }

        CommunityComment comment = CommunityComment.builder()
                .post(post)
                .user(currentUser)
                .parentComment(parentComment)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);
        post.incrementCommentsCount();
        postRepository.save(post);

        log.info("Comment created: {} on post: {} by user: {}", comment.getId(), postId, currentUser.getEmail());

        // Notify post owner or parent comment owner
        User notifyUser = parentComment != null ? parentComment.getUser() : post.getUser();
        if (!notifyUser.getId().equals(currentUser.getId())) {
            String message = parentComment != null
                    ? currentUser.getFullName() + " replied to your comment"
                    : currentUser.getFullName() + " commented on your post";
            notificationService.createNotification(
                    notifyUser,
                    "New Comment",
                    message,
                    com.academy.entity.enums.NotificationType.COMMUNITY,
                    "/community/posts/" + postId
            );
        }

        return CommentResponse.fromEntity(comment, false, false);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(UUID commentId, String content) {
        User currentUser = getCurrentUser();
        CommunityComment comment = findCommentById(commentId);
        verifyOwnerOrAdmin(comment.getUser(), currentUser);

        comment.setContent(content);
        comment.setIsEdited(true);
        comment = commentRepository.save(comment);

        log.info("Comment updated: {}", commentId);

        boolean isLiked = commentLikeRepository.existsByUserAndComment(currentUser, comment);
        return CommentResponse.fromEntity(comment, isLiked, false);
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId) {
        User currentUser = getCurrentUser();
        CommunityComment comment = findCommentById(commentId);
        verifyOwnerOrAdmin(comment.getUser(), currentUser);

        comment.setIsDeleted(true);
        commentRepository.save(comment);

        CommunityPost post = comment.getPost();
        post.decrementCommentsCount();
        postRepository.save(post);

        log.info("Comment deleted: {}", commentId);
    }

    @Override
    @Transactional
    public void likeComment(UUID commentId) {
        User currentUser = getCurrentUser();
        verifySubscriptionAccess(currentUser);

        CommunityComment comment = findCommentById(commentId);

        if (commentLikeRepository.existsByUserAndComment(currentUser, comment)) {
            throw new BadRequestException("You have already liked this comment");
        }

        CommentLike like = CommentLike.builder()
                .user(currentUser)
                .comment(comment)
                .build();
        commentLikeRepository.save(like);

        comment.incrementLikesCount();
        commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void unlikeComment(UUID commentId) {
        User currentUser = getCurrentUser();
        CommunityComment comment = findCommentById(commentId);

        CommentLike like = commentLikeRepository.findByUserAndComment(currentUser, comment)
                .orElseThrow(() -> new BadRequestException("You have not liked this comment"));

        commentLikeRepository.delete(like);
        comment.decrementLikesCount();
        commentRepository.save(comment);
    }

    @Override
    public PageResponse<PostResponse> getMyAnnouncements(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityPost> postsPage = postRepository
                .findByUserAndPostTypeAndIsDeletedFalseOrderByCreatedAtDesc(
                        currentUser, PostType.ANNOUNCEMENT, pageable);
        return PageResponse.from(postsPage, post -> PostResponse.fromEntity(post, false));
    }

    @Override
    public PageResponse<PostResponse> getFlaggedPosts(int page, int size) {
        User currentUser = getCurrentUser();
        verifyAdmin(currentUser);

        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityPost> postsPage = postRepository.findFlaggedPosts(pageable);

        return PageResponse.from(postsPage, post -> PostResponse.fromEntity(post, false));
    }

    @Override
    @Transactional
    public void clearFlag(UUID postId) {
        User currentUser = getCurrentUser();
        verifyAdmin(currentUser);

        CommunityPost post = findPostById(postId);
        post.setIsFlagged(false);
        post.setFlagReason(null);
        postRepository.save(post);

        log.info("Flag cleared for post: {} by admin: {}", postId, currentUser.getEmail());
    }

    private CommunityPost findPostById(UUID id) {
        return postRepository.findById(id)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Post", "id", id));
    }

    private CommunityComment findCommentById(UUID id) {
        return commentRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));
    }

    private void verifySubscriptionAccess(User user) {
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.INSTRUCTOR) {
            return;
        }
        // Check both the Subscription entity AND the denormalised status field on User
        // (the latter handles dev/test cases where the User field is set directly)
        boolean hasActiveSubscription =
                user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE ||
                subscriptionRepository.findByUserAndStatus(user, SubscriptionStatus.ACTIVE).isPresent();
        if (!hasActiveSubscription) {
            throw new ForbiddenException("Active subscription required to post in the community");
        }
    }

    private void verifyOwnerOrAdmin(User owner, User currentUser) {
        if (currentUser.getRole() != UserRole.ADMIN && !owner.getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You don't have permission to perform this action");
        }
    }

    private void verifyAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
    }

    private User getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.findById(userPrincipal.getId());
    }
}
