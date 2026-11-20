import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 
import {
  AccountResponse,
  CreateAccountRequest,
  UpdateAccountRequest
} from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient) {}

  list(): Observable<AccountResponse[]> {
    return this.http.get<AccountResponse[]>(`${API}/accounts`);
  }

  get(id: string): Observable<AccountResponse> {
    return this.http.get<AccountResponse>(`${API}/accounts/${id}`);
  }

  create(req: CreateAccountRequest): Observable<AccountResponse> {
    return this.http.post<AccountResponse>(`${API}/accounts`, req);
  }

  update(
    id: string,
    req: UpdateAccountRequest
  ): Observable<AccountResponse> {
    return this.http.put<AccountResponse>(`${API}/accounts/${id}`, req);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/accounts/${id}`);
  }
}