import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BudgetService } from '../../core/services/budget';
import { CategoryService } from '../../core/services/category';
import { BudgetResponse, CategoryResponse } from '../../core/models';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressBarModule, MatSnackBarModule],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css',
})
export class Budgets implements OnInit {
  budgets = signal<BudgetResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editing = signal<BudgetResponse | null>(null);
  form!: FormGroup;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  constructor(private budgetService: BudgetService, private categoryService: CategoryService,
    private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      categoryId: [null],
      valorLimite: [null, [Validators.required, Validators.min(1)]],
      alertaEm: [80],
    });
    this.load();
    this.categoryService.list().subscribe((c) => this.categories.set(c));
  }

  monthName(): string { return MONTHS[this.currentMonth - 1]; }

  prevMonth(): void {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else this.currentMonth--;
    this.load();
  }

  nextMonth(): void {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else this.currentMonth++;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.budgetService.list(this.currentMonth, this.currentYear).subscribe({
      next: (list) => { this.budgets.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(b?: BudgetResponse): void {
    this.editing.set(b ?? null);
    if (b) this.form.patchValue({ categoryId: b.categoryId ?? null, valorLimite: b.valorLimite, alertaEm: b.alertaEm ?? 80 });
    else this.form.reset({ categoryId: null, valorLimite: null, alertaEm: 80 });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const req = { categoryId: v.categoryId ?? undefined, valorLimite: v.valorLimite, mes: this.currentMonth, ano: this.currentYear, alertaEm: v.alertaEm ?? undefined };
    const call = this.editing() ? this.budgetService.update(this.editing()!.id, req) : this.budgetService.create(req);
    call.subscribe({
      next: () => { this.snack.open(this.editing() ? 'Atualizado!' : 'Criado!', '', { duration: 3000 }); this.closeForm(); this.load(); this.saving.set(false); },
      error: (e) => { this.snack.open(e.error?.message || 'Erro', '', { duration: 4000, panelClass: 'error-snack' }); this.saving.set(false); },
    });
  }

  delete(id: string): void {
    if (!confirm('Excluir orçamento?')) return;
    this.budgetService.delete(id).subscribe({ next: () => this.load() });
  }

  progressColor(pct: number): string {
    if (pct >= 100) return 'warn';
    if (pct >= 80) return 'accent';
    return 'primary';
  }
}
