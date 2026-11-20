import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BudgetResponse,
  CreateBudgetRequest
} from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private http: HttpClient) {}

  list(
    mes: number,
    ano: number
  ): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(
      `${API}/budgets`,
      {
        params: new HttpParams()
          .set('mes', mes)
          .set('ano', ano)
      }
    );
  }

  create(
    req: CreateBudgetRequest
  ): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(
      `${API}/budgets`,
      req
    );
  }

  update(
    id: string,
    req: CreateBudgetRequest
  ): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(
      `${API}/budgets/${id}`,
      req
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${API}/budgets/${id}`
    );
  }
}