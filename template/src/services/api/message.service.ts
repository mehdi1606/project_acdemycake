import api from './axios.config';

export interface ConversationInfo {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface MessagesPageResponse {
  content: ChatMessage[];
  page: number;
  totalPages: number;
  totalElements: number;
}

class MessageService {
  async getConversations(): Promise<ConversationInfo[]> {
    const response = await api.get<ConversationInfo[]>('/messages/conversations');
    return Array.isArray(response.data) ? response.data : [];
  }

  async getConversation(userId: string, page = 0, size = 100): Promise<MessagesPageResponse> {
    const response = await api.get<MessagesPageResponse>(`/messages/conversations/${userId}`, {
      params: { page, size },
    });
    return response.data;
  }

  async sendMessage(receiverId: string, content: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>('/messages/send', { receiverId, content });
    return response.data;
  }

  async markConversationAsRead(userId: string): Promise<void> {
    await api.put(`/messages/conversations/${userId}/read`);
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<number>('/messages/unread-count');
    return response.data ?? 0;
  }
}

export const messageService = new MessageService();
export default messageService;
