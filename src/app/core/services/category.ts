import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoryResponse } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  list(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(
      `${API}/categories`
    );
  }
}