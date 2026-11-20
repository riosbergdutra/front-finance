import { Component, OnInit, OnDestroy, signal, HostBinding, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { WsNotificationService } from '../../../core/websocket/ws-notification';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatBadgeModule, MatMenuModule, MatTooltipModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  // FIX: host classes gerenciadas aqui em vez de no template,
  // para que o CSS correto seja aplicado desde o primeiro frame
  // sem depender de change detection do Angular — evita FOUC.
  host: {
    '[class.collapsed]':     'isMobile() ? false : (isTablet() ? false : collapsed())',
    '[class.sidebar-open]':  'isMobile() && mobileOpen()',
    '[class.tablet-expanded]': 'isTablet() && tabletExpanded()',
  }
})
export class ShellComponent implements OnInit, OnDestroy {
  collapsed     = signal(false);   // desktop: sidebar colapsada
  mobileOpen    = signal(false);   // mobile: sidebar aberta
  tabletExpanded = signal(false);  // tablet: sidebar expandida manualmente
  unread = signal(0);

  private platformId = inject(PLATFORM_ID);
  private wsSub?: Subscription;

  navItems = [
    { icon: 'dashboard',              label: 'Dashboard',    route: '/app/dashboard' },
    { icon: 'account_balance_wallet', label: 'Contas',       route: '/app/accounts' },
    { icon: 'receipt_long',           label: 'Transações',   route: '/app/transactions' },
    { icon: 'donut_small',            label: 'Orçamentos',   route: '/app/budgets' },
    { icon: 'savings',                label: 'Metas',        route: '/app/goals' },
    { icon: 'notifications',          label: 'Notificações', route: '/app/notifications' },
  ];

  constructor(
    private auth: AuthService,
    private ws: WsNotificationService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.notifSvc.listUnread().subscribe({ next: (l) => this.unread.set(l.length), error: () => {} });
    this.wsSub = this.ws.connect().subscribe(() => this.unread.update((n) => n + 1));
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.ws.disconnect();
  }

  /** Detecta mobile (≤768px) */
  isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.innerWidth <= 768;
  }

  /** Detecta tablet (769–1024px) */
  isTablet(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  toggle(): void {
    if (this.isMobile()) {
      // Mobile: abre/fecha o drawer lateral
      this.mobileOpen.update(v => !v);
    } else if (this.isTablet()) {
      // Tablet: expande/colapsa para exibir labels
      this.tabletExpanded.update(v => !v);
    } else {
      // Desktop: colapsa/expande sidebar para 60px/220px
      this.collapsed.update(v => !v);
    }
  }

  /** Fecha a sidebar ao clicar em um item do nav (mobile) */
  onNavClick(): void {
    if (this.isMobile()) this.mobileOpen.set(false);
  }

  logout(): void { this.auth.logout(); }
}
