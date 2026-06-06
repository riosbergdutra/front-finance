import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SubscriptionResponse } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private http: HttpClient) {}

  getMyPlan(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(
      `${API}/subscriptions/me`
    );
  }
}