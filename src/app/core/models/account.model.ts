export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'DINHEIRO'
  | 'OTHER';

export interface AccountResponse {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  initialBalance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface UpdateAccountRequest {
  name: string;
  type: AccountType;
  color?: string;
  icon?: string;
}