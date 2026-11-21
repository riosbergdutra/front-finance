import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { forkJoin } from 'rxjs';
import { toLocalDateInputValue } from '../../core/utils/date';

import { DashboardService } from '../../core/services/dashboard';
import { TransactionService } from '../../core/services/transaction';

import {
  DashboardResponse,
  TransactionResponse,
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatProgressBarModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {

  loading = signal(true);
  data = signal<DashboardResponse | null>(null);
  recentTx = signal<TransactionResponse[]>([]);

    private readonly dashboardService = inject(DashboardService);
  private readonly txService = inject(TransactionService);

  ngOnInit(): void {
    const today = new Date();

    const inicio = toLocalDateInputValue(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const fim = toLocalDateInputValue(today);

    forkJoin({
      dashboard: this.dashboardService.get(),
      transactions: this.txService.list(inicio, fim, 0, 5),
    }).subscribe({
      next: ({ dashboard, transactions }) => {
        this.data.set(dashboard);
        this.recentTx.set(transactions.content);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  spendingRatio(): number {
    const d = this.data();

    if (!d || d.receitasMes === 0) {
      return 0;
    }

    return Math.min(
      (d.despesasMes / d.receitasMes) * 100,
      100
    );
  }

  balancePercent(): number {
    const d = this.data();

    if (!d || d.receitasMes === 0) {
      return 0;
    }

    return (
      ((d.receitasMes - d.despesasMes) /
        d.receitasMes) *
      100
    );
  }
}