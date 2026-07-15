import api, { apiMultipart } from './axios.config';
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

  async uploadPostImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    // axios interceptor already unwraps ApiResponse<String> → response.data is the URL string
    const response = await apiMultipart.post<string>(`${this.base}/posts/upload-image`, form);
    return response.data as string;
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

  async pinPost(id: string): Promise<void> {
    await api.post(`${this.base}/posts/${id}/pin`);
  }

  async unpinPost(id: string): Promise<void> {
    await api.delete(`${this.base}/posts/${id}/pin`);
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

  async uploadAchievementFile(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const response = await apiMultipart.post<string>(
      `${this.base}/comments/upload-achievement-file`,
      form
    );
    return response.data as string;
  }

  async addComment(
    postId: string,
    content: string,
    achievementText?: string,
    achievementIcon?: string,
    achievementFileUrl?: string
  ): Promise<CommunityComment> {
    const body: Record<string, unknown> = { content };
    const hasAchievement = (achievementText && achievementText.trim()) || achievementFileUrl;
    if (hasAchievement) {
      body.achievementText    = achievementText?.trim() || null;
      body.achievementIcon    = achievementIcon ?? null;
      body.achievementFileUrl = achievementFileUrl ?? null;
    }
    const response = await api.post<CommunityComment>(
      `${this.base}/posts/${postId}/comments`,
      body
    );
    return response.data;
  }

  // Alias for addComment
  async createComment(
    postId: string,
    content: string,
    achievementText?: string,
    achievementIcon?: string,
    achievementFileUrl?: string
  ): Promise<CommunityComment> {
    return this.addComment(postId, content, achievementText, achievementIcon, achievementFileUrl);
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
