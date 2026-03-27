package com.academy.service;

import com.academy.dto.request.CreateCommentRequest;
import com.academy.dto.request.CreatePostRequest;
import com.academy.dto.response.CommentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PostResponse;
import com.academy.entity.enums.PostType;

import java.util.UUID;

public interface CommunityService {

    PageResponse<PostResponse> getPosts(int page, int size, PostType postType, String search);

    PostResponse getPostById(UUID id);

    PostResponse createPost(CreatePostRequest request);

    PostResponse updatePost(UUID id, CreatePostRequest request);

    void deletePost(UUID id);

    void likePost(UUID postId);

    void unlikePost(UUID postId);

    void pinPost(UUID postId);

    void unpinPost(UUID postId);

    void reportPost(UUID postId, String reason);

    PageResponse<CommentResponse> getPostComments(UUID postId, int page, int size);

    CommentResponse createComment(UUID postId, CreateCommentRequest request);

    CommentResponse updateComment(UUID commentId, String content);

    void deleteComment(UUID commentId);

    void likeComment(UUID commentId);

    void unlikeComment(UUID commentId);

    PageResponse<PostResponse> getMyAnnouncements(int page, int size);

    PageResponse<PostResponse> getFlaggedPosts(int page, int size);

    void clearFlag(UUID postId);
}
