export type NotificationType =
  | 'ORCAMENTO_PROXIMO'
  | 'ORCAMENTO_ESTOURADO'
  | 'META_CONCLUIDA'
  | 'META_PRAZO'
  | 'CONTA_SALDO_NEGATIVO'
  | 'ASSINATURA_EXPIRANDO'
  | 'ASSINATURA_EXPIRADA'
  | 'TRANSACAO_PENDENTE';

export interface NotificationResponse {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  entidadeTipo?: string;
  entidadeId?: string;
  criadoEm: string;
}