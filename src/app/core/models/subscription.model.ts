export type PlanType =
  | 'FREE'
  | 'PRO';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PENDING_PAYMENT';

export interface SubscriptionResponse {
  plano: PlanType;
  status: SubscriptionStatus;
  isPro: boolean;
  inicioPeriodo?: string;
  fimPeriodo?: string;
  diasParaExpirar: number;
  limiteContas: number;
  limiteTransacoesMes: number;
}