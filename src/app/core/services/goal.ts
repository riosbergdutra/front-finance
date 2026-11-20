import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GoalResponse, CreateGoalRequest } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class GoalService {
  constructor(private http: HttpClient) {}

  list(pendentes = false): Observable<GoalResponse[]> {
    return this.http.get<GoalResponse[]>(`${API}/goals`, { params: { pendentes } });
  }

  get(id: string): Observable<GoalResponse> {
    return this.http.get<GoalResponse>(`${API}/goals/${id}`);
  }

  create(req: CreateGoalRequest): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${API}/goals`, req);
  }

  update(id: string, req: CreateGoalRequest): Observable<GoalResponse> {
    return this.http.put<GoalResponse>(`${API}/goals/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/goals/${id}`);
  }

  /** Adiciona valor à meta */
  depositar(id: string, valor: number): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${API}/goals/${id}/depositar`, { valor });
  }

  /** Remove valor da meta */
  sacar(id: string, valor: number): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${API}/goals/${id}/sacar`, { valor });
  }

  /** Conclui a meta manualmente */
  concluir(id: string): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${API}/goals/${id}/concluir`, {});
  }

  /** Projeção de dias para conclusão */
  projecao(id: string): Observable<{ diasEstimados: number }> {
    return this.http.get<{ diasEstimados: number }>(`${API}/goals/${id}/projecao`);
  }

  /** Compat: addDeposit → depositar */
  addDeposit(id: string, valor: number): Observable<GoalResponse> {
    return this.depositar(id, valor);
  }
}
