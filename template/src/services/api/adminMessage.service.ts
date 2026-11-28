import api from './axios.config';

export interface AdminPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface AdminConversation {
  userA: AdminPerson;
  userB: AdminPerson;
  messages: number;
  lastMessageAt?: string | null;
  lastMessage: string;
}

export interface AdminMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

interface Paged<T> { content: T[]; totalElements: number }

export const adminMessageService = {
  async conversations(search: string, page: number, size: number): Promise<Paged<AdminConversation>> {
    const r = await api.get<Paged<AdminConversation>>('/admin/messages/conversations', {
      params: { search: search || undefined, page, size },
    });
    return r.data;
  },
  async conversation(a: string, b: string, page = 0, size = 200): Promise<Paged<AdminMessage>> {
    const r = await api.get<Paged<AdminMessage>>('/admin/messages/conversation', { params: { a, b, page, size } });
    return r.data;
  },
};

export default adminMessageService;
