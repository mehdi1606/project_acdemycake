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
      params: { page, size, type },
    });
    return response.data;
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
