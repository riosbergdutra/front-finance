import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AccountService } from '../../core/services/account'; 
import {
  AccountResponse,
  AccountType
} from '../../core/models';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT: 'Investimento',
  DINHEIRO: 'CASH',
  OTHER: 'Outro',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css'
})
export class AccountsComponent implements OnInit {

  accounts = signal<AccountResponse[]>([]);
  loading = signal(true);

  showForm = signal(false);
  saving = signal(false);

  editing = signal<AccountResponse | null>(null);

  accountTypes = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
    value: value as AccountType,
    label,
  }));

  form: FormGroup;

  constructor(
    private accountService: AccountService,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['CHECKING', Validators.required],
      initialBalance: [0],
      color: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.accountService.list().subscribe({
      next: (list) => {
        this.accounts.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openForm(acc?: AccountResponse): void {
    this.editing.set(acc ?? null);

    if (acc) {
      this.form.patchValue({
        name: acc.name,
        type: acc.type,
        color: acc.color ?? '',
      });
    } else {
      this.form.reset({
        name: '',
        type: 'CHECKING',
        initialBalance: 0,
        color: '',
      });
    }

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {

    if (this.form.invalid) return;

    this.saving.set(true);

    const v = this.form.value;
    const acc = this.editing();

    const request = acc
      ? this.accountService.update(acc.id, {
          name: v.name!,
          type: v.type!,
          color: v.color || undefined,
        })
      : this.accountService.create({
          name: v.name!,
          type: v.type!,
          initialBalance: v.initialBalance ?? 0,
          color: v.color || undefined,
        });

    request.subscribe({
      next: () => {
        this.snack.open(
          acc ? 'Conta atualizada!' : 'Conta criada!',
          '',
          { duration: 3000 }
        );

        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: (e) => {
        this.snack.open(
          e.error?.message || 'Erro ao salvar',
          '',
          {
            duration: 4000,
            panelClass: 'error-snack'
          }
        );

        this.saving.set(false);
      }
    });
  }

  deactivate(id: string): void {

    if (!confirm('Desativar esta conta?')) {
      return;
    }

    this.accountService.deactivate(id).subscribe({
      next: () => {
        this.snack.open(
          'Conta desativada.',
          '',
          { duration: 3000 }
        );

        this.load();
      },
      error: () => {
        this.snack.open(
          'Erro ao desativar.',
          '',
          {
            duration: 3000,
            panelClass: 'error-snack'
          }
        );
      }
    });
  }

  getTypeLabel(type: AccountType): string {
    return ACCOUNT_TYPE_LABELS[type] ?? type;
  }

  getIcon(type: AccountType): string {

    const icons: Record<AccountType, string> = {
      CHECKING: 'account_balance',
      SAVINGS: 'savings',
      CREDIT_CARD: 'credit_card',
      INVESTMENT: 'trending_up',
      DINHEIRO: 'payments',
      OTHER: 'wallet',
    };

    return icons[type] ?? 'wallet';
  }
}