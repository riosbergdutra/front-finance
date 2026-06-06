import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { AccountResponse, CategoryResponse, TransactionResponse } from "../../core/models";
import { TransactionService } from "../../core/services/transaction";
import { AccountService } from "../../core/services/account";
import { CategoryService } from "../../core/services/category";

@Component({
  selector: 'app-transactions',
  standalone: true,
 imports: [
  CommonModule,
  CurrencyPipe,
  DatePipe,

  ReactiveFormsModule,
  FormsModule,

  MatSnackBarModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatPaginatorModule,
],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class TransactionsComponent implements OnInit {

  transactions = signal<TransactionResponse[]>([]);
  accounts = signal<AccountResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);

  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);

  totalElements = signal(0);

  currentPage = 0;

  filterDe =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split('T')[0];

  filterAte =
    new Date()
      .toISOString()
      .split('T')[0];

  form!: FormGroup;

  constructor(
    private txService: TransactionService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {}

  // Initialize form after fb is available
  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['DESPESA', Validators.required],
      accountId: ['', Validators.required],
      valor: [
        null as number | null,
        [Validators.required, Validators.min(0.01)]
      ],
      data: [
        new Date().toISOString().split('T')[0],
        Validators.required
      ],
      categoryId: [null as string | null],
      descricao: [''],
    });

    this.load();

    this.accountService
      .list()
      .subscribe((a) => this.accounts.set(a));

    this.categoryService
      .list()
      .subscribe((c) => this.categories.set(c));
  }

  load(): void {

    this.loading.set(true);

    this.txService
      .list(
        this.filterDe,
        this.filterAte,
        this.currentPage
      )
      .subscribe({
        next: (page) => {

          this.transactions.set(page.content);

          this.totalElements.set(
            page.totalElements
          );

          this.loading.set(false);
        },

        error: () => {
          this.loading.set(false);
        }
      });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.load();
  }

  openForm(): void {
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    const value = this.form.value;

    this.txService.create({
      tipo: value.tipo as any,
      accountId: value.accountId!,
      valor: value.valor!,
      data: value.data!,
      categoryId: value.categoryId ?? undefined,
      descricao: value.descricao ?? undefined,
    })
    .subscribe({
      next: () => {

        this.snack.open(
          'Transação criada!',
          '',
          { duration: 3000 }
        );

        this.closeForm();
        this.load();

        this.saving.set(false);
      },

      error: (e) => {

        this.snack.open(
          e.error?.message || 'Erro',
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

  delete(id: string): void {

    if (!confirm('Excluir esta transação?')) {
      return;
    }

    this.txService.delete(id).subscribe({
      next: () => this.load()
    });
  }

  statusBadge(status: string): string {

    if (status === 'CONFIRMADA') {
      return 'badge-green';
    }

    if (status === 'PENDENTE') {
      return 'badge-yellow';
    }

    return 'badge-red';
  }
}