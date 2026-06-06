import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NotificationService } from '../../core/services/notification';
import { NotificationResponse } from '../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe, MatSnackBarModule, MatPaginatorModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  notifications = signal<NotificationResponse[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  currentPage = 0;

  constructor(private notifSvc: NotificationService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.notifSvc.list(this.currentPage).subscribe({
      next: (p) => { this.notifications.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void { this.currentPage = e.pageIndex; this.load(); }

  markRead(id: string): void {
    const n = this.notifications().find(x => x.id === id);
    if (!n || n.lida) return;
    this.notifSvc.markRead(id).subscribe({
      next: () => this.notifications.update(list => list.map(x => x.id === id ? { ...x, lida: true } : x)),
    });
  }

  markAllRead(): void {
    this.notifSvc.markAllRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, lida: true })));
        this.snack.open('Todas marcadas como lidas.', '', { duration: 3000 });
      },
    });
  }

  tipoIcon(tipo: string): string {
    const m: Record<string, string> = {
      ORCAMENTO_PROXIMO: 'warning', ORCAMENTO_ESTOURADO: 'error',
      META_CONCLUIDA: 'check_circle', META_PRAZO: 'event',
      CONTA_SALDO_NEGATIVO: 'money_off', ASSINATURA_EXPIRANDO: 'schedule',
      ASSINATURA_EXPIRADA: 'block', TRANSACAO_PENDENTE: 'pending',
    };
    return m[tipo] ?? 'notifications';
  }

  iconClass(tipo: string): string {
    if (['ORCAMENTO_ESTOURADO','CONTA_SALDO_NEGATIVO','ASSINATURA_EXPIRADA'].includes(tipo)) return 'error';
    if (['ORCAMENTO_PROXIMO','ASSINATURA_EXPIRANDO','META_PRAZO'].includes(tipo)) return 'warn';
    if (['META_CONCLUIDA'].includes(tipo)) return 'success';
    return 'info';
  }
}
