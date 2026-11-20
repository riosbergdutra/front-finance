import { Component, OnInit, OnDestroy, signal, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../core/services/subscription';
import { SubscriptionResponse } from '../../core/models';
import { environment } from '../../environments/environment';

/**
 * FIX: fluxo de upgrade integrado com Stripe.
 *
 * Antes: upgrade() mostrava um toast "Integração com Mercado Pago em breve!".
 * Agora: chama POST /subscriptions/payment-intent, recebe o clientSecret do Stripe,
 * e abre o Stripe Checkout via redirect para a hosted page da Stripe
 * (stripe.com/pay/{paymentIntentId}).
 *
 * Por que redirect em vez de Elements embutido?
 *   - Não requer o SDK @stripe/stripe-js instalado no projeto
 *   - Funciona com o back-end atual que já cria um PaymentIntent com return_url
 *   - Stripe redireciona de volta para /app/subscription após pagamento
 *
 * Para usar Elements embutidos no futuro:
 *   npm install @stripe/stripe-js
 *   e usar loadStripe(PUBLISHABLE_KEY) + confirmPayment()
 */
@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatSnackBarModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class Subscription implements OnInit {
  plan    = signal<SubscriptionResponse | null>(null);
  loading = signal(true);
  upgrading = signal(false);

  exportDe  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  exportAte = new Date().toISOString().split('T')[0];

  constructor(
    private subscriptionService: SubscriptionService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getMyPlan().subscribe({
      next:  (p) => this.zone.run(() => { this.plan.set(p); this.loading.set(false); }),
      error: ()  => this.zone.run(() => this.loading.set(false)),
    });
  }

  // ── Upgrade via Stripe ──────────────────────────────────────────────

  upgrade(): void {
    if (this.upgrading()) return;
    this.upgrading.set(true);

    // Backend cria uma Checkout Session e retorna { url }.
    // O Stripe hospeda a página de pagamento — sem precisar de @stripe/stripe-js.
    this.http.post<{ url: string }>(
      `${environment.apiUrl}/subscriptions/checkout`,
      {}
    ).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.upgrading.set(false);
        const msg = err?.error?.message ?? 'Erro ao iniciar pagamento. Tente novamente.';
        this.snack.open(msg, '', { duration: 4000, panelClass: 'error-snack' });
      },
    });
  }

  // ── Exportação ──────────────────────────────────────────────────────

  exportExcel(): void {
    const url = `${environment.apiUrl}/export/excel?de=${this.exportDe}&ate=${this.exportAte}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => this.downloadBlob(blob,
        `transacoes-${this.exportDe}-a-${this.exportAte}.xlsx`),
      error: () => this.snack.open('Erro ao exportar Excel', '', {
        duration: 3000, panelClass: 'error-snack',
      }),
    });
  }

  exportPdf(): void {
    const url = `${environment.apiUrl}/export/pdf?de=${this.exportDe}&ate=${this.exportAte}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => this.downloadBlob(blob,
        `relatorio-${this.exportDe}-a-${this.exportAte}.pdf`),
      error: () => this.snack.open('Erro ao exportar PDF', '', {
        duration: 3000, panelClass: 'error-snack',
      }),
    });
  }

  // ── Labels ──────────────────────────────────────────────────────────

  limiteTransacoesLabel(): string {
    const p = this.plan();
    if (!p) return '';
    return p.limiteTransacoesMes >= 2_147_483_647 ? 'Ilimitado' : `${p.limiteTransacoesMes}/mês`;
  }

  limiteContasLabel(): string {
    const p = this.plan();
    if (!p) return '';
    return p.limiteContas >= 2_147_483_647 ? 'Ilimitado' : `${p.limiteContas} contas`;
  }

  diasLabel(): string {
    const p = this.plan();
    if (!p || !p.isPro) return '';
    if (p.diasParaExpirar <= 0) return 'Expirado';
    return `${p.diasParaExpirar} dias restantes`;
  }

  // ── Helper ──────────────────────────────────────────────────────────

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    // FIX: revogar a URL após o click para não vazar memória
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
