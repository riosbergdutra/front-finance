import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  constructor(private auth: AuthService) {}

  get isAuth() { return this.auth.isAuthenticated(); }

  goApp(): void {
    if (this.isAuth) {
      window.location.href = '/app/dashboard';
    } else {
      this.auth.login();
    }
  }

  features = [
    { icon: 'account_balance_wallet', title: 'Múltiplas Contas', desc: 'Corrente, poupança, cartão e investimentos em um só lugar.' },
    { icon: 'receipt_long',           title: 'Transações',       desc: 'Registre receitas e despesas com categorização automática.' },
    { icon: 'donut_small',            title: 'Orçamentos',       desc: 'Defina limites mensais por categoria e receba alertas em tempo real.' },
    { icon: 'savings',                title: 'Metas Financeiras',desc: 'Crie objetivos e acompanhe seu progresso com projeções.' },
    { icon: 'notifications_active',   title: 'Notificações',     desc: 'Alertas instantâneos via WebSocket — sem precisar recarregar.' },
    { icon: 'workspace_premium',      title: 'Plano PRO',        desc: 'Exportação Excel/PDF e importação via Open Finance.' },
  ];

  plans = [
    {
      name: 'Free', price: 'R$ 0', period: '/mês', highlight: false,
      features: ['3 contas ativas', '100 transações/mês', 'Orçamentos e metas', 'Notificações em tempo real'],
      cta: 'Começar grátis',
    },
    {
      name: 'PRO', price: 'R$ 19,90', period: '/mês', highlight: true,
      features: ['Contas ilimitadas', 'Transações ilimitadas', 'Exportar Excel e PDF', 'Open Finance (bancos)'],
      cta: 'Assinar PRO',
    },
  ];
}
