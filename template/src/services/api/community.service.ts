import api from './axios.config';
import {
  CommunityPost,
  CommunityComment,
  CreatePostRequest,
  PaginatedResponse,
  PostType,
} from './types';

class CommunityService {
  // ============================================
  // Posts
  // ============================================

  // Get posts
  async getPosts(
    page = 0,
    size = 20,
    type?: PostType,
    search?: string
  ): Promise<PaginatedResponse<CommunityPost>> {
    const response = await api.get<PaginatedResponse<CommunityPost>>('/community/posts', {
      params: { page, size, type, search },
    });
    return response.data;
  }

  // Get post details
  async getPostById(postId: number): Promise<CommunityPost> {
    const response = await api.get<CommunityPost>(`/community/posts/${postId}`);
    return response.data;
  }

  // Create post
  async createPost(data: CreatePostRequest): Promise<CommunityPost> {
    const response = await api.post<CommunityPost>('/community/posts', data);
    return response.data;
  }

  // Update post
  async updatePost(postId: number, data: CreatePostRequest): Promise<CommunityPost> {
    const response = await api.put<CommunityPost>(`/community/posts/${postId}`, data);
    return response.data;
  }

  // Delete post
  async deletePost(postId: number): Promise<void> {
    await api.delete(`/community/posts/${postId}`);
  }

  // Like post
  async likePost(postId: number): Promise<void> {
    await api.post(`/community/posts/${postId}/like`);
  }

  // Unlike post
  async unlikePost(postId: number): Promise<void> {
    await api.delete(`/community/posts/${postId}/like`);
  }

  // Report post
  async reportPost(postId: number, reason: string): Promise<void> {
    await api.post(`/community/posts/${postId}/report`, { reason });
  }

  // ============================================
  // Comments
  // ============================================

  // Get comments for a post
  async getPostComments(
    postId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<CommunityComment>> {
    const response = await api.get<PaginatedResponse<CommunityComment>>(`/community/posts/${postId}/comments`, {
      params: { page, size },
    });
    return response.data;
  }

  // Add comment
  async addComment(postId: number, content: string): Promise<CommunityComment> {
    const response = await api.post<CommunityComment>(`/community/posts/${postId}/comments`, {
      content,
    });
    return response.data;
  }

  // Delete comment
  async deleteComment(commentId: number): Promise<void> {
    await api.delete(`/community/comments/${commentId}`);
  }

  // Like comment
  async likeComment(commentId: number): Promise<void> {
    await api.post(`/community/comments/${commentId}/like`);
  }

  // Unlike comment
  async unlikeComment(commentId: number): Promise<void> {
    await api.delete(`/community/comments/${commentId}/like`);
  }
}

export const communityService = new CommunityService();
export default communityService;
