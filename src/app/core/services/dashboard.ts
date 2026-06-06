import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardResponse } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  get(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${API}/dashboard`);
  }
}