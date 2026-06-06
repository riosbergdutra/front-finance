import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../core/services/subscription';
import { SubscriptionResponse } from '../../core/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatSnackBarModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class Subscription implements OnInit {
  plan = signal<SubscriptionResponse | null>(null);
  loading = signal(true);

  exportDe = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  exportAte = new Date().toISOString().split('T')[0];

  constructor(
    private subscriptionService: SubscriptionService,
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getMyPlan().subscribe({
      next: (p) => { this.plan.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  upgrade(): void {
    this.snack.open('Integração com Mercado Pago em breve!', '', { duration: 4000 });
  }

  exportExcel(): void {
    const url = `${environment.apiUrl}/export/excel?de=${this.exportDe}&ate=${this.exportAte}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `transacoes-${this.exportDe}-a-${this.exportAte}.xlsx`;
        a.click();
      },
      error: () => this.snack.open('Erro ao exportar Excel', '', { duration: 3000, panelClass: 'error-snack' }),
    });
  }

  exportPdf(): void {
    const url = `${environment.apiUrl}/export/pdf?de=${this.exportDe}&ate=${this.exportAte}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `relatorio-${this.exportDe}-a-${this.exportAte}.pdf`;
        a.click();
      },
      error: () => this.snack.open('Erro ao exportar PDF', '', { duration: 3000, panelClass: 'error-snack' }),
    });
  }

  limiteTransacoesLabel(): string {
    const p = this.plan();
    if (!p) return '';
    return p.limiteTransacoesMes >= 2147483647 ? 'Ilimitado' : `${p.limiteTransacoesMes}/mês`;
  }

  limiteContasLabel(): string {
    const p = this.plan();
    if (!p) return '';
    return p.limiteContas >= 2147483647 ? 'Ilimitado' : `${p.limiteContas} contas`;
  }

  diasLabel(): string {
    const p = this.plan();
    if (!p || !p.isPro) return '';
    if (p.diasParaExpirar <= 0) return 'Expirado';
    return `${p.diasParaExpirar} dias restantes`;
  }
}
