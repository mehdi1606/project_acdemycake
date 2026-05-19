import api from './axios.config';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketCategory =
  | 'PAYMENT_ISSUES'
  | 'TECHNICAL_ISSUES'
  | 'COURSE_ACCESS'
  | 'ACCOUNT_ISSUES'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TicketMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  isAdminReply: boolean;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  messageCount: number;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  messages?: TicketMessage[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateTicketPayload {
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

// ─── Human-readable labels ────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  PAYMENT_ISSUES: 'Payment Issues',
  TECHNICAL_ISSUES: 'Technical Issues',
  COURSE_ACCESS: 'Course Access',
  ACCOUNT_ISSUES: 'Account Issues',
  GENERAL_INQUIRY: 'General Inquiry',
  OTHER: 'Other',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
};

// ─── Service ──────────────────────────────────────────────────────────────────

class TicketService {
  // ── Student ──────────────────────────────────────────────────────────────

  async getMyStats(): Promise<TicketStats> {
    const res = await api.get<TicketStats>('/student/tickets/stats');
    return res.data;
  }

  async getMyTickets(
    page = 0,
    size = 10,
    status?: TicketStatus
  ): Promise<PageResponse<Ticket>> {
    const res = await api.get<PageResponse<Ticket>>('/student/tickets', {
      params: { page, size, ...(status ? { status } : {}) },
    });
    return res.data;
  }

  async getMyTicket(id: string): Promise<Ticket> {
    const res = await api.get<Ticket>(`/student/tickets/${id}`);
    return res.data;
  }

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const res = await api.post<Ticket>('/student/tickets', payload);
    return res.data;
  }

  async replyToTicket(ticketId: string, content: string): Promise<Ticket> {
    const res = await api.post<Ticket>(`/student/tickets/${ticketId}/reply`, { content });
    return res.data;
  }

  async closeTicket(ticketId: string): Promise<void> {
    await api.put(`/student/tickets/${ticketId}/close`);
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async getAdminStats(): Promise<TicketStats> {
    const res = await api.get<TicketStats>('/admin/tickets/stats');
    return res.data;
  }

  async getAllTickets(
    page = 0,
    size = 10,
    status?: TicketStatus
  ): Promise<PageResponse<Ticket>> {
    const res = await api.get<PageResponse<Ticket>>('/admin/tickets', {
      params: { page, size, ...(status ? { status } : {}) },
    });
    return res.data;
  }

  async getAdminTicket(id: string): Promise<Ticket> {
    const res = await api.get<Ticket>(`/admin/tickets/${id}`);
    return res.data;
  }

  async adminReply(ticketId: string, content: string): Promise<Ticket> {
    const res = await api.post<Ticket>(`/admin/tickets/${ticketId}/reply`, { content });
    return res.data;
  }

  async updateStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
    const res = await api.put<Ticket>(`/admin/tickets/${ticketId}/status`, { status });
    return res.data;
  }
}

export const ticketService = new TicketService();
export default ticketService;

// ─── Contact Messages (public form + admin view) ──────────────────────────────

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactStats {
  total: number;
  unread: number;
}

class ContactService {
  /** Public — no auth required */
  async submit(payload: ContactMessagePayload): Promise<void> {
    await api.post('/public/contact', payload);
  }

  /** Admin — requires ADMIN role */
  async getAll(page = 0, size = 10, unreadOnly?: boolean): Promise<PageResponse<ContactMessage>> {
    const res = await api.get<PageResponse<ContactMessage>>('/admin/contact-messages', {
      params: { page, size, ...(unreadOnly ? { unreadOnly: true } : {}) },
    });
    return res.data;
  }

  async getStats(): Promise<ContactStats> {
    const res = await api.get<ContactStats>('/admin/contact-messages/stats');
    return res.data;
  }

  async markRead(id: string): Promise<ContactMessage> {
    const res = await api.patch<ContactMessage>(`/admin/contact-messages/${id}/read`);
    return res.data;
  }

  async deleteMessage(id: string): Promise<void> {
    await api.delete(`/admin/contact-messages/${id}`);
  }
}

export const contactService = new ContactService();
