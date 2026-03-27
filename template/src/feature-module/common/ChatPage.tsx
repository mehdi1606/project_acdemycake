import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Spin } from 'antd';
import { useAppSelector } from '../../core/redux/hooks';
import { messageService, ConversationInfo, ChatMessage } from '../../services/api/message.service';
import { getFileUrl } from '../../environment';

// ─── helpers ──────────────────────────────────────────────────────────────────

const avatar = (url?: string | null) =>
  getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const formatTime = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const formatFullTime = (iso?: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── interfaces ───────────────────────────────────────────────────────────────

interface ChatPageProps {
  /** Sidebar component injected by the parent page */
  sidebar: React.ReactNode;
  /** ProfileCard component — accepted but rendered by parent; kept for API compat */
  profileCard: React.ReactNode;
  /**
   * Optional: pre-open a conversation with this participant on mount.
   * Used by the instructor page when navigating from a student profile
   * (e.g. /instructor/messages?studentId=xxx&studentName=John)
   */
  initialParticipantId?: string;
  initialParticipantName?: string;
}

// ─── component ────────────────────────────────────────────────────────────────

const ChatPage: React.FC<ChatPageProps> = ({
  sidebar,
  initialParticipantId,
  initialParticipantName,
}) => {
  const currentUser = useAppSelector((s) => s.auth.user);

  // ── conversation list ──────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── active conversation ───────────────────────────────────────────────────
  const [activeConv, setActiveConv] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  // ── compose ───────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // ── refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // ── load conversations ────────────────────────────────────────────────────
  const loadConversations = useCallback(async (): Promise<ConversationInfo[]> => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
      return data;
    } catch {
      return [];
    } finally {
      setConvLoading(false);
    }
  }, []);

  // ── load messages for active conversation ─────────────────────────────────
  const loadMessages = useCallback(async (userId: string, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const data = await messageService.getConversation(userId, 0, 100);
      // Backend returns newest-first; reverse for display (oldest at top)
      setMessages([...(data.content ?? [])].reverse());
    } catch {
      // silent
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const openConversation = useCallback(
    async (conv: ConversationInfo) => {
      setActiveConv(conv);
      activeConvIdRef.current = conv.participantId;
      setMessages([]);

      // Clear old message poll
      if (msgPollRef.current) clearInterval(msgPollRef.current);

      await loadMessages(conv.participantId);

      // Mark as read
      messageService.markConversationAsRead(conv.participantId).catch(() => {});

      // Update unread count in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.participantId === conv.participantId ? { ...c, unreadCount: 0 } : c
        )
      );

      // Poll every 3 seconds for new messages
      msgPollRef.current = setInterval(() => {
        if (activeConvIdRef.current) {
          loadMessages(activeConvIdRef.current, true);
        }
      }, 3_000);
    },
    [loadMessages]
  );

  // ── bootstrap: load convs, then optionally open initial participant ────────
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    loadConversations().then((convs) => {
      if (initialParticipantId) {
        const existing = convs.find((c) => c.participantId === initialParticipantId);
        if (existing) {
          openConversation(existing);
        } else {
          // Create a virtual conversation entry for a new conversation
          const virtual: ConversationInfo = {
            participantId: initialParticipantId,
            participantName: initialParticipantName ?? 'User',
            participantAvatar: undefined,
            lastMessage: '',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            isOnline: false,
          };
          setConversations((prev) => [virtual, ...prev]);
          openConversation(virtual);
        }
      }
    });

    // Conversation list polling (every 10 s)
    convPollRef.current = setInterval(loadConversations, 10_000);

    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current);
      if (msgPollRef.current) clearInterval(msgPollRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!draft.trim() || !activeConv || sending) return;
    const text = draft.trim();
    setSending(true);
    setDraft('');

    // Optimistic: add immediately
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      senderId: currentUser?.id ?? '',
      senderName: currentUser?.fullName ?? 'Me',
      senderAvatar: currentUser?.avatarUrl,
      receiverId: activeConv.participantId,
      receiverName: activeConv.participantName,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await messageService.sendMessage(activeConv.participantId, text);
      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? sent : m)));

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.participantId === activeConv.participantId
            ? { ...c, lastMessage: text, lastMessageAt: sent.createdAt }
            : c
        )
      );
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── filtered conversations ─────────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="row">
      {sidebar}

      <div className="col-lg-9">
        <div className="instructor-message">
          <h5 className="page-title d-flex align-items-center gap-2">
            Messages
            {totalUnread > 0 && (
              <span className="badge bg-danger rounded-pill">{totalUnread}</span>
            )}
          </h5>

          <div className="row g-0 border rounded-3 overflow-hidden" style={{ minHeight: '600px' }}>
            {/* ── LEFT: conversation list ─────────────────────────────── */}
            <div className="col-lg-5 border-end d-flex flex-column">
              <div className="p-3 border-bottom">
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <i className="isax isax-search-normal-1 fs-14" />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-md"
                    placeholder="Search conversations…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-auto flex-grow-1" style={{ maxHeight: '540px' }}>
                {convLoading ? (
                  <div className="d-flex justify-content-center align-items-center py-5">
                    <Spin />
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="text-center text-muted py-5 px-3">
                    <i className="isax isax-message fs-1 d-block mb-2" />
                    {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <button
                      key={conv.participantId}
                      type="button"
                      className={`d-flex justify-content-between align-items-center w-100 px-3 py-3 border-bottom text-start bg-transparent border-start-0 border-end-0 border-top-0 chat-member${
                        activeConv?.participantId === conv.participantId
                          ? ' active bg-light'
                          : ''
                      }`}
                      onClick={() => openConversation(conv)}
                    >
                      <div className="d-flex align-items-center overflow-hidden">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2 position-relative">
                          <img
                            src={avatar(conv.participantAvatar)}
                            alt={conv.participantName}
                            className="rounded-circle"
                            style={{ width: 42, height: 42, objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'assets/img/user/user-02.jpg';
                            }}
                          />
                          {conv.isOnline && (
                            <span
                              className="position-absolute bottom-0 end-0 badge bg-success rounded-circle border border-white"
                              style={{ width: 10, height: 10, padding: 0 }}
                            />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="mb-0 fw-semibold text-truncate">{conv.participantName}</p>
                          <small className="text-muted text-truncate d-block">
                            {conv.lastMessage || 'No messages yet'}
                          </small>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ms-2 text-end">
                        <small className="text-muted d-block">
                          {formatTime(conv.lastMessageAt)}
                        </small>
                        {conv.unreadCount > 0 && (
                          <span className="badge bg-primary rounded-pill mt-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── RIGHT: message thread ──────────────────────────────── */}
            <div className="col-lg-7 d-flex flex-column">
              {!activeConv ? (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted py-5">
                  <i className="isax isax-message-text-1 fs-1 mb-3" />
                  <p className="mb-0">Select a conversation to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="d-flex align-items-center px-3 py-2 border-bottom bg-light">
                    <div className="avatar avatar-md avatar-rounded me-2">
                      <img
                        src={avatar(activeConv.participantAvatar)}
                        alt={activeConv.participantName}
                        className="rounded-circle"
                        style={{ width: 40, height: 40, objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'assets/img/user/user-02.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <p className="mb-0 fw-semibold">{activeConv.participantName}</p>
                      <small className="text-muted">
                        {activeConv.isOnline ? (
                          <span className="text-success">● Online</span>
                        ) : (
                          'Offline'
                        )}
                      </small>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="flex-grow-1 overflow-auto p-3"
                    style={{ maxHeight: '460px', minHeight: '200px' }}
                  >
                    {msgLoading ? (
                      <div className="d-flex justify-content-center py-5">
                        <Spin />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted py-5">
                        <i className="isax isax-message-add-1 fs-1 d-block mb-2" />
                        <p className="mb-0">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`d-flex mb-3${isMine ? ' flex-row-reverse' : ''}`}
                          >
                            {!isMine && (
                              <img
                                src={avatar(msg.senderAvatar)}
                                alt={msg.senderName}
                                className="rounded-circle flex-shrink-0 me-2 align-self-end"
                                style={{ width: 32, height: 32, objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'assets/img/user/user-02.jpg';
                                }}
                              />
                            )}
                            <div
                              className={`d-flex flex-column${isMine ? ' align-items-end me-2' : ' align-items-start'}`}
                              style={{ maxWidth: '72%' }}
                            >
                              <div
                                className={`px-3 py-2 rounded-3 ${
                                  isMine
                                    ? 'bg-primary text-white'
                                    : 'bg-light border text-dark'
                                }`}
                                style={{ wordBreak: 'break-word' }}
                              >
                                {msg.content}
                              </div>
                              <small
                                className="text-muted mt-1"
                                title={formatFullTime(msg.createdAt)}
                              >
                                {formatTime(msg.createdAt)}
                                {isMine && (
                                  <span className="ms-1">
                                    {msg.isRead ? (
                                      <i className="fa fa-check-double text-primary" />
                                    ) : (
                                      <i className="fa fa-check text-muted" />
                                    )}
                                  </span>
                                )}
                              </small>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Compose */}
                  <div className="border-top p-3 d-flex gap-2 align-items-end">
                    <textarea
                      ref={inputRef}
                      className="form-control"
                      rows={1}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
                      disabled={sending}
                    />
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center flex-shrink-0"
                      onClick={sendMessage}
                      disabled={!draft.trim() || sending}
                    >
                      {sending ? (
                        <Spin size="small" />
                      ) : (
                        <i className="isax isax-send-2" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
