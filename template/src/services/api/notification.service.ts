import api from './axios.config';
import { Notification, PaginatedResponse, NotificationType } from './types';

class NotificationService {
  // Get notifications
  async getNotifications(
    page = 0,
    size = 20,
    type?: NotificationType
  ): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
      params: { page, size, ...(type ? { type } : {}) },
    });
    return response.data;
  }

  // Get unread count — backend returns ApiResponse<Long>, interceptor unwraps to bare number
  async getUnreadCount(): Promise<number> {
    const response = await api.get<number>('/notifications/unread-count');
    return typeof response.data === 'number' ? response.data : 0;
  }

  // Mark notification as read (UUID id)
  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  }

  // Delete notification (UUID id)
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
