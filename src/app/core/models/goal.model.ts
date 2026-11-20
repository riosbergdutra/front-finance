export interface GoalResponse {
  id: string;
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  percentualConcluido: number;
  dataAlvo?: string;
  concluida: boolean;
  cor?: string;
  icone?: string;
  criadoEm: string;
}

export interface CreateGoalRequest {
  nome: string;
  valorAlvo: number;
  dataAlvo?: string;
  cor?: string;
  icone?: string;
}