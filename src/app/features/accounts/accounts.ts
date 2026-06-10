import { Component, OnInit, signal, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from '../../core/services/account';
import { SubscriptionService } from '../../core/services/subscription';
import { AccountResponse, AccountType, SubscriptionResponse } from '../../core/models';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CORRENTE:         'Conta Corrente',
  POUPANCA:         'Poupança',
  CARTAO_CREDITO:   'Cartão de Crédito',
  INVESTIMENTO:     'Investimento',
  DINHEIRO:         'Dinheiro / Carteira',
  CARTEIRA_DIGITAL: 'Carteira Digital',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CurrencyPipe, ReactiveFormsModule,
    MatSnackBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class AccountsComponent implements OnInit {
  private readonly accountService      = inject(AccountService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly fb                  = inject(FormBuilder);
  private readonly snack               = inject(MatSnackBar);

  accounts     = signal<AccountResponse[]>([]);
  subscription = signal<SubscriptionResponse | null>(null);
  loading      = signal(true);
  showForm     = signal(false);
  saving       = signal(false);
  editing      = signal<AccountResponse | null>(null);

  accountTypes = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
    value: value as AccountType,
    label,
  }));

  form = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(100)]],
    type:           ['CORRENTE' as AccountType, Validators.required],
    initialBalance: [0],
    color:          ['', [Validators.pattern(/^#[0-9A-Fa-f]{6}$|^$/)]],
  });

  ngOnInit(): void {
    this.load();
    this.subscriptionService.getMyPlan().subscribe({
      next: (s) => this.subscription.set(s),
      error: () => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.accountService.list().subscribe({
      next: (list) => { this.accounts.set(list); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }

  /** Retorna true se o usuário FREE já atingiu o limite de 3 contas */
  atLimitFree(): boolean {
    const s = this.subscription();
    if (!s || s.isPro) return false;
    return this.accounts().length >= s.limiteContas;
  }

  openForm(acc?: AccountResponse): void {
    if (!acc && this.atLimitFree()) {
      this.snack.open(
        `Plano FREE permite até ${this.subscription()!.limiteContas} contas. Faça upgrade para o PRO.`,
        'Ver plano',
        { duration: 5000 }
      );
      return;
    }
    this.editing.set(acc ?? null);
    if (acc) {
      this.form.patchValue({ name: acc.name, type: acc.type, color: acc.color ?? '' });
    } else {
      this.form.reset({ name: '', type: 'CORRENTE', initialBalance: 0, color: '' });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v   = this.form.value;
    const acc = this.editing();

    const obs = acc
      ? this.accountService.update(acc.id, { name: v.name!, type: v.type!, color: v.color || undefined })
      : this.accountService.create({ name: v.name!, type: v.type!, initialBalance: v.initialBalance ?? 0, color: v.color || undefined });

    obs.subscribe({
      next: () => {
        this.snack.open(acc ? 'Conta atualizada!' : 'Conta criada!', '', { duration: 3000 });
        this.closeForm(); this.load(); this.saving.set(false);
        // Atualiza contagem do plano
        this.subscriptionService.getMyPlan().subscribe({ next: (s) => this.subscription.set(s), error: () => {} });
      },
      error: (e: HttpErrorResponse) => {
        // 402 = limite do plano, 409 = nome duplicado, 400 = validação
        const msg = e.error?.message ?? (
          e.status === 402 ? 'Limite de contas atingido. Faça upgrade para o PRO.' :
          e.status === 409 ? 'Já existe uma conta com este nome.' :
          'Erro ao salvar conta.'
        );
        this.snack.open(msg, '', { duration: 5000, panelClass: 'error-snack' });
        this.saving.set(false);
      },
    });
  }

  deactivate(id: string): void {
    if (!confirm('Desativar esta conta? As transações serão preservadas.')) return;
    this.accountService.deactivate(id).subscribe({
      next:  () => { this.snack.open('Conta desativada.', '', { duration: 3000 }); this.load(); },
      error: () => { this.snack.open('Erro ao desativar.', '', { duration: 3000, panelClass: 'error-snack' }); },
    });
  }

  getTypeLabel(type: AccountType): string { return ACCOUNT_TYPE_LABELS[type] ?? type; }

  getIcon(type: AccountType): string {
    const icons: Record<AccountType, string> = {
      CORRENTE:         'account_balance',
      POUPANCA:         'savings',
      CARTAO_CREDITO:   'credit_card',
      INVESTIMENTO:     'trending_up',
      DINHEIRO:         'payments',
      CARTEIRA_DIGITAL: 'account_balance_wallet',
    };
    return icons[type] ?? 'wallet';
  }
}