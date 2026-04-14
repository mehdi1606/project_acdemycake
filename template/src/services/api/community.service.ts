import api from './axios.config';
import { CommunityPost, CommunityComment, PostType, PaginatedResponse, CreatePostRequest } from './types';

class CommunityService {
  private base = '/community';

  // ── Posts ──────────────────────────────────────────────────────────────────

  async getPosts(
    page = 0,
    size = 10,
    postType?: PostType,
    search?: string
  ): Promise<PaginatedResponse<CommunityPost>> {
    const response = await api.get<PaginatedResponse<CommunityPost>>(`${this.base}/posts`, {
      params: { page, size, ...(postType ? { postType } : {}), ...(search ? { search } : {}) },
    });
    return response.data;
  }

  async getPostById(id: string): Promise<CommunityPost> {
    const response = await api.get<CommunityPost>(`${this.base}/posts/${id}`);
    return response.data;
  }

  async createPost(data: CreatePostRequest): Promise<CommunityPost> {
    const response = await api.post<CommunityPost>(`${this.base}/posts`, data);
    return response.data;
  }

  async updatePost(id: string, data: CreatePostRequest): Promise<CommunityPost> {
    const response = await api.put<CommunityPost>(`${this.base}/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: string): Promise<void> {
    await api.delete(`${this.base}/posts/${id}`);
  }

  async likePost(id: string): Promise<void> {
    await api.post(`${this.base}/posts/${id}/like`);
  }

  async unlikePost(id: string): Promise<void> {
    await api.delete(`${this.base}/posts/${id}/like`);
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getPostComments(
    postId: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<CommunityComment>> {
    const response = await api.get<PaginatedResponse<CommunityComment>>(
      `${this.base}/posts/${postId}/comments`,
      { params: { page, size } }
    );
    return response.data;
  }

  // Alias for getPostComments
  async getComments(postId: string, page = 0, size = 20): Promise<PaginatedResponse<CommunityComment>> {
    return this.getPostComments(postId, page, size);
  }

  async addComment(postId: string, content: string): Promise<CommunityComment> {
    const response = await api.post<CommunityComment>(
      `${this.base}/posts/${postId}/comments`,
      { content }
    );
    return response.data;
  }

  // Alias for addComment
  async createComment(postId: string, content: string): Promise<CommunityComment> {
    return this.addComment(postId, content);
  }

  async deleteComment(id: string): Promise<void> {
    await api.delete(`${this.base}/comments/${id}`);
  }

  async likeComment(id: string): Promise<void> {
    await api.post(`${this.base}/comments/${id}/like`);
  }

  async unlikeComment(id: string): Promise<void> {
    await api.delete(`${this.base}/comments/${id}/like`);
  }
}

export const communityService = new CommunityService();
export default communityService;
