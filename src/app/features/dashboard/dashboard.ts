import { Component, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard';
import { TransactionService } from '../../core/services/transaction';
import { DashboardResponse, TransactionResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MatProgressBarModule],
  templateUrl: './dashboard.html',
  // FIX: era styleUrls (array) — Angular 17+ standalone usa styleUrl (singular)
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  loading  = signal(true);
  data     = signal<DashboardResponse | null>(null);
  recentTx = signal<TransactionResponse[]>([]);

  constructor(
    private dashboardService: DashboardService,
    private txService: TransactionService,
    // FIX: com provideHttpClient(withFetch()), os callbacks do subscribe rodam
    // fora da NgZone — o Angular não detecta as mudanças dos signals e a view
    // não atualiza até o próximo evento (clique, hover...).
    // NgZone.run() força um ciclo de change detection imediatamente.
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const today  = new Date();
    const inicio = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const fim    = today.toISOString().split('T')[0];

    forkJoin({
      dashboard:    this.dashboardService.get(),
      transactions: this.txService.list(inicio, fim, 0, 5),
    }).subscribe({
      next: ({ dashboard, transactions }) => {
        this.zone.run(() => {
          this.data.set(dashboard);
          this.recentTx.set(transactions.content);
          this.loading.set(false);
        });
      },
      error: () => this.zone.run(() => this.loading.set(false)),
    });
  }

  spendingRatio(): number {
    const d = this.data();
    if (!d || d.receitasMes === 0) return 0;
    return Math.min((d.despesasMes / d.receitasMes) * 100, 100);
  }

  balancePercent(): number {
    const d = this.data();
    if (!d || d.receitasMes === 0) return 0;
    return ((d.receitasMes - d.despesasMes) / d.receitasMes) * 100;
  }
}
