import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AuthService } from '../services/auth'; 
import { environment } from '../../environments/environment';
import { NotificationResponse } from '../models'; 

/**
 * Gerencia a conexão WebSocket com o backend para notificações em tempo real.
 *
 * Conexão: ws://backend/ws/notifications?token=<access_token>
 * O token vai no query param porque browsers não permitem headers customizados
 * na abertura de conexões WebSocket.
 *
 * Reconexão automática com backoff exponencial (1s, 2s, 4s, 8s, máx 30s).
 */
@Injectable({ providedIn: 'root' })
export class WsNotificationService implements OnDestroy {
  private ws: WebSocket | null = null;
  private notification$ = new Subject<NotificationResponse>();
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(private auth: AuthService) {}

  connect(): Observable<NotificationResponse> {
    this.openConnection();
    return this.notification$.asObservable();
  }

  private openConnection(): void {
    const token = this.auth.getToken();
    if (!token || this.destroyed) return;

    const url = `${environment.wsUrl}?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const notif: NotificationResponse = JSON.parse(event.data);
        this.notification$.next(notif);
      } catch {
        // ignora mensagens malformadas
      }
    };

    this.ws.onclose = () => {
      if (!this.destroyed) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };

    this.ws.onopen = () => {
      this.reconnectDelay = 1000; // reseta backoff em conexão bem-sucedida
    };
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      this.openConnection();
    }, this.reconnectDelay);
  }

  disconnect(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}