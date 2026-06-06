import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoalService } from '../../core/services/goal';
import { GoalResponse } from '../../core/models';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './goals.html',
  styleUrl: './goals.css',
})
export class Goals implements OnInit {
  goals = signal<GoalResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  showDepositForm = signal<string | null>(null);
  depositMode = signal<'depositar' | 'sacar'>('depositar');
  saving = signal(false);

  form!: FormGroup;
  depositForm!: FormGroup;

  constructor(private goalService: GoalService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      valorAlvo: [null, [Validators.required, Validators.min(1)]],
      dataAlvo: [null],
      cor: [''],
    });
    this.depositForm = this.fb.group({ valor: [null, [Validators.required, Validators.min(0.01)]] });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.goalService.list().subscribe({
      next: (list) => { this.goals.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void { this.form.reset(); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    this.goalService.create({ nome: v.nome, valorAlvo: v.valorAlvo, dataAlvo: v.dataAlvo || undefined, cor: v.cor || undefined }).subscribe({
      next: () => { this.snack.open('Meta criada!', '', { duration: 3000 }); this.closeForm(); this.load(); this.saving.set(false); },
      error: (e) => { this.snack.open(e.error?.message || 'Erro', '', { duration: 4000, panelClass: 'error-snack' }); this.saving.set(false); },
    });
  }

  openDeposit(id: string): void { this.depositMode.set('depositar'); this.depositForm.reset(); this.showDepositForm.set(id); }
  openWithdraw(id: string): void { this.depositMode.set('sacar'); this.depositForm.reset(); this.showDepositForm.set(id); }
  closeDeposit(): void { this.showDepositForm.set(null); }

  deposit(): void {
    if (this.depositForm.invalid) return;
    const id = this.showDepositForm();
    if (!id) return;
    this.saving.set(true);
    const call = this.depositMode() === 'depositar'
      ? this.goalService.depositar(id, this.depositForm.value.valor)
      : this.goalService.sacar(id, this.depositForm.value.valor);
    call.subscribe({
      next: () => { this.snack.open('Operação realizada!', '', { duration: 3000 }); this.closeDeposit(); this.load(); this.saving.set(false); },
      error: (e) => { this.snack.open(e.error?.message || 'Erro', '', { duration: 4000, panelClass: 'error-snack' }); this.saving.set(false); },
    });
  }

  concluir(id: string): void {
    if (!confirm('Marcar esta meta como concluída?')) return;
    this.goalService.concluir(id).subscribe({ next: () => { this.snack.open('Meta concluída!', '', { duration: 3000 }); this.load(); } });
  }

  delete(id: string): void {
    if (!confirm('Excluir esta meta?')) return;
    this.goalService.delete(id).subscribe({ next: () => this.load() });
  }
}
