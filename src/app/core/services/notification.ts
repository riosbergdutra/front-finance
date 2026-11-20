import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NotificationResponse,
  Page
} from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  listUnread(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${API}/notifications/unread`
    );
  }

  list(
    page = 0,
    size = 20
  ): Observable<Page<NotificationResponse>> {
    return this.http.get<Page<NotificationResponse>>(
      `${API}/notifications`,
      {
        params: new HttpParams()
          .set('page', page)
          .set('size', size)
      }
    );
  }

  markRead(id: string): Observable<void> {
    return this.http.patch<void>(
      `${API}/notifications/${id}/read`,
      {}
    );
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(
      `${API}/notifications/read-all`,
      {}
    );
  }
}