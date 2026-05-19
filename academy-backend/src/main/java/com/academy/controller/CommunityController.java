package com.academy.controller;

import com.academy.dto.request.CreateCommentRequest;
import com.academy.dto.request.CreatePostRequest;
import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.CommentResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PostResponse;
import com.academy.entity.enums.PostType;
import com.academy.service.CommunityService;
import com.academy.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Tag(name = "Community", description = "Community posts and comments")
public class CommunityController {

    private final CommunityService communityService;
    private final FileStorageService fileStorageService;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/png", "image/jpeg", "image/jpg", "image/webp"
    );

    @GetMapping("/posts")
    @Operation(summary = "Get community posts with pagination")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) PostType postType,
            @RequestParam(required = false) String search) {

        PageResponse<PostResponse> response = communityService.getPosts(page, size, postType, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/posts/{id}")
    @Operation(summary = "Get post by ID")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable UUID id) {
        PostResponse response = communityService.getPostById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/posts/upload-image")
    @Operation(summary = "Upload an image to attach to a community post")
    public ResponseEntity<ApiResponse<String>> uploadPostImage(@RequestParam("file") MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only PNG, JPG and WebP images are allowed"));
        }
        String relativePath = fileStorageService.storeFile(file, "community");
        String url = fileStorageService.getFileUrl(relativePath);
        return ResponseEntity.ok(ApiResponse.success("Image uploaded", url));
    }

    @PostMapping("/posts")
    @Operation(summary = "Create a new post")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(@Valid @RequestBody CreatePostRequest request) {
        PostResponse response = communityService.createPost(request);
        return ResponseEntity.ok(ApiResponse.success("Post created", response));
    }

    @PutMapping("/posts/{id}")
    @Operation(summary = "Update a post")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePostRequest request) {

        PostResponse response = communityService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Post updated", response));
    }

    @DeleteMapping("/posts/{id}")
    @Operation(summary = "Delete a post")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable UUID id) {
        communityService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post deleted"));
    }

    @PostMapping("/posts/{id}/like")
    @Operation(summary = "Like a post")
    public ResponseEntity<ApiResponse<Void>> likePost(@PathVariable UUID id) {
        communityService.likePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post liked"));
    }

    @DeleteMapping("/posts/{id}/like")
    @Operation(summary = "Unlike a post")
    public ResponseEntity<ApiResponse<Void>> unlikePost(@PathVariable UUID id) {
        communityService.unlikePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post unliked"));
    }

    @PostMapping("/posts/{id}/report")
    @Operation(summary = "Report a post")
    public ResponseEntity<ApiResponse<Void>> reportPost(
            @PathVariable UUID id,
            @RequestParam String reason) {

        communityService.reportPost(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Post reported"));
    }

    @GetMapping("/posts/{id}/comments")
    @Operation(summary = "Get comments for a post")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getPostComments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<CommentResponse> response = communityService.getPostComments(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/posts/{id}/comments")
    @Operation(summary = "Add a comment to a post")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest request) {

        CommentResponse response = communityService.createComment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Comment added", response));
    }

    @DeleteMapping("/comments/{id}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID id) {
        communityService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted"));
    }

    @PostMapping("/comments/{id}/like")
    @Operation(summary = "Like a comment")
    public ResponseEntity<ApiResponse<Void>> likeComment(@PathVariable UUID id) {
        communityService.likeComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment liked"));
    }

    @DeleteMapping("/comments/{id}/like")
    @Operation(summary = "Unlike a comment")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(@PathVariable UUID id) {
        communityService.unlikeComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked"));
    }
}
