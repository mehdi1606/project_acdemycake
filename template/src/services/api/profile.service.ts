import api, { apiMultipart } from './axios.config';
import { User, UpdateProfileRequest, ChangePasswordRequest, NotificationPreferences } from './types';

class ProfileService {
  private basePath = '/profile';

  // Get current user profile (from /auth/me)
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put<User>(this.basePath, data);
    // Update stored user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const updatedUser = { ...JSON.parse(storedUser), ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiMultipart.post<string>(`${this.basePath}/avatar`, formData);
    const avatarUrl = response.data;

    // Persist updated avatarUrl in localStorage so it survives page refresh
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const updatedUser = { ...JSON.parse(storedUser), avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    return avatarUrl;
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put(`${this.basePath}/password`, data);
  }

  // Get notification preferences (raw JSON string from backend)
  async getNotificationPreferences(): Promise<string> {
    const response = await api.get<string>(`${this.basePath}/preferences`);
    return typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: Record<string, boolean>): Promise<void> {
    await api.put(`${this.basePath}/preferences`, JSON.stringify(preferences), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Request email verification resend
  async resendVerificationEmail(email: string): Promise<void> {
    await api.post('/auth/resend-verification', null, { params: { email } });
  }
}

export const profileService = new ProfileService();
export default profileService;
