import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationResponse } from '../models';

/**
 * Opens the notifications WebSocket using the browser-managed HttpOnly session
 * cookie. No OAuth token is read or placed in the WebSocket URL.
 */
@Injectable({ providedIn: 'root' })
export class WsNotificationService implements OnDestroy {
  private ws: WebSocket | null = null;
  private readonly notification$ = new Subject<NotificationResponse>();
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  connect(): Observable<NotificationResponse> {
    this.destroyed = false;
    this.openConnection();
    return this.notification$.asObservable();
  }

  private openConnection(): void {
    if (this.destroyed) return;

    // The browser automatically sends the SESSION_ID cookie for the API host.
    this.ws = new WebSocket(environment.wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const notification: NotificationResponse = JSON.parse(event.data);
        this.notification$.next(notification);
      } catch {
        // Ignore malformed messages.
      }
    };

    this.ws.onclose = () => {
      if (!this.destroyed) this.scheduleReconnect();
    };

    this.ws.onerror = () => this.ws?.close();

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
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
