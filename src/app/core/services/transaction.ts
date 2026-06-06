import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Page,
  TransactionResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest
} from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private http: HttpClient) {}

  list(
    de?: string,
    ate?: string,
    page = 0,
    size = 20
  ): Observable<Page<TransactionResponse>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (de) params = params.set('de', de);
    if (ate) params = params.set('ate', ate);

    return this.http.get<Page<TransactionResponse>>(
      `${API}/transactions`,
      { params }
    );
  }

  get(id: string): Observable<TransactionResponse> {
    return this.http.get<TransactionResponse>(
      `${API}/transactions/${id}`
    );
  }

  create(
    req: CreateTransactionRequest
  ): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      `${API}/transactions`,
      req
    );
  }

  update(
    id: string,
    req: UpdateTransactionRequest
  ): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(
      `${API}/transactions/${id}`,
      req
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${API}/transactions/${id}`
    );
  }
}