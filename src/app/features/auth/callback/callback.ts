import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.html',
  styleUrl: './callback.css',
})
export class CallbackComponent implements OnInit {
  error: string | null = null;
  loading = true;

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // O BFF já concluiu o code exchange e criou o cookie HttpOnly.
    // O frontend recebe somente um redirect limpo e recupera o access token via sessão.
    this.auth.refresh().subscribe({
      next: () => this.router.navigate(['/app/dashboard'], { replaceUrl: true }),
      error: () => {
        this.error = 'Falha na autenticação. Tente novamente.';
        this.loading = false;
      },
    });
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
}
