import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './callback.html',
  styleUrl: './callback.css',
})
export class CallbackComponent implements OnInit {
  error: string | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe({
      next: (params) => {
        const code = params['code'];
        if (!code) {
          this.error = 'Código de autorização não encontrado.';
          this.loading = false;
          return;
        }
        this.http
          .post<{ access_token: string }>(`${environment.apiUrl}/auth/callback?code=${code}`, {}, { withCredentials: true })
          .subscribe({
            next: (res) => {
              if (res?.access_token) {
                this.auth.setToken(res.access_token);
                this.router.navigate(['/app/dashboard'], { replaceUrl: true });
              } else {
                this.error = 'Token inválido retornado pelo servidor.';
                this.loading = false;
              }
            },
            error: () => {
              this.error = 'Falha na autenticação. Tente novamente.';
              this.loading = false;
            },
          });
      },
    });
  }

  goLogin(): void { this.router.navigate(['/login']); }
}
