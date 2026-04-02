import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL, ACCESS_TOKEN_KEY } from '../../environment';

type MessageHandler = (message: IMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private pendingSubscriptions: Array<{ topic: string; handler: MessageHandler; id: string }> = [];
  private onConnectCallbacks: Array<() => void> = [];
  private onDisconnectCallbacks: Array<() => void> = [];

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve();
        return;
      }

      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      this.client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          // Flush pending subscriptions
          for (const { topic, handler, id } of this.pendingSubscriptions) {
            const sub = this.client!.subscribe(topic, handler);
            this.subscriptions.set(id, sub);
          }
          this.pendingSubscriptions = [];
          this.onConnectCallbacks.forEach((cb) => cb());
          resolve();
        },

        onDisconnect: () => {
          this.onDisconnectCallbacks.forEach((cb) => cb());
        },

        onStompError: (frame) => {
          reject(new Error(frame.headers['message'] ?? 'STOMP error'));
        },
      });

      this.client.activate();
    });
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
  }

  subscribe(topic: string, handler: MessageHandler, id?: string): string {
    const subId = id ?? `${topic}-${Date.now()}`;

    if (this.client?.connected) {
      const sub = this.client.subscribe(topic, handler);
      this.subscriptions.set(subId, sub);
    } else {
      this.pendingSubscriptions.push({ topic, handler, id: subId });
    }

    return subId;
  }

  unsubscribe(id: string): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(id);
    }
    this.pendingSubscriptions = this.pendingSubscriptions.filter((p) => p.id !== id);
  }

  publish(destination: string, body: object): void {
    if (!this.client?.connected) return;
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  onConnect(cb: () => void): void {
    this.onConnectCallbacks.push(cb);
  }

  onDisconnect(cb: () => void): void {
    this.onDisconnectCallbacks.push(cb);
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
export default wsService;
