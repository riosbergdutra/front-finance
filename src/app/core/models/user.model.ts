export interface User {
  id: string;
  keycloakId: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  locale: string;
  ativo: boolean;
}