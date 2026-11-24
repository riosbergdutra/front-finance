import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.html',
  styleUrl: './callback.css',
})
export class CallbackComponent implements OnInit {
  readonly error = signal<string | null>(null);

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // O BFF concluiu o code exchange e criou o cookie HttpOnly.
    // O frontend apenas confirma a sessão; nenhum token OAuth é recebido.
    this.auth.checkSession().subscribe({
      next: (session) => {
        if (session.authenticated) {
          void this.router.navigate(['/app/dashboard'], { replaceUrl: true });
        } else {
          this.goLogin();
        }
      },
      error: () => {
        // Signals notificam o Angular mesmo em execução zoneless.
        this.error.set('Falha na autenticação. Tente novamente.');
      },
    });
  }

  goLogin(): void {
    void this.router.navigate(['/login']);
  }
}
