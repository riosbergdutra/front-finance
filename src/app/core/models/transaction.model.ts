export type TransactionType =
  | 'RECEITA'
  | 'DESPESA'
  | 'TRANSFERENCIA';

export type TransactionStatus =
  | 'CONFIRMADA'
  | 'PENDENTE'
  | 'CANCELADA';

export interface TransactionResponse {
  id: string;
  accountId: string;
  contaDestinoId?: string;
  categoryId?: string;
  categoryNome?: string;
  tipo: TransactionType;
  status: TransactionStatus;
  valor: number;
  descricao?: string;
  estabelecimento?: string;
  data: string;
  criadoEm: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  contaDestinoId?: string;
  categoryId?: string;
  tipo: TransactionType;
  status?: TransactionStatus;
  valor: number;
  descricao?: string;
  estabelecimento?: string;
  data: string;
}

export interface UpdateTransactionRequest {
  categoryId?: string;
  tipo: TransactionType;
  status: TransactionStatus;
  valor: number;
  descricao?: string;
  estabelecimento?: string;
  data: string;
}