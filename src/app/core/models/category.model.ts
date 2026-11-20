export type CategoryType =
  | 'RECEITA'
  | 'DESPESA'
  | 'AMBOS';

export interface CategoryResponse {
  id: string;
  nome: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  isSystem: boolean;
}