export interface BudgetResponse {
  id: string;
  categoryId?: string;
  categoryNome: string;
  valorLimite: number;
  valorGasto: number;
  percentualGasto: number;
  mes: number;
  ano: number;
  alertaEm?: number;
}

export interface CreateBudgetRequest {
  categoryId?: string;
  valorLimite: number;
  mes: number;
  ano: number;
  alertaEm?: number;
}