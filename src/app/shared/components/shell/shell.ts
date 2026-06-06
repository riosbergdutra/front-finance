import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
})
export class ShellComponent implements OnInit, OnDestroy {
  collapsed = signal(false);
  unread = signal(0);

  navItems = [
    { icon: 'dashboard',              label: 'Dashboard',   route: '/app/dashboard' },
    { icon: 'account_balance_wallet', label: 'Contas',      route: '/app/accounts' },
    { icon: 'receipt_long',           label: 'Transações',  route: '/app/transactions' },
    { icon: 'donut_small',            label: 'Orçamentos',  route: '/app/budgets' },
    { icon: 'savings',                label: 'Metas',       route: '/app/goals' },
    { icon: 'notifications',          label: 'Notificações',route: '/app/notifications' },
  ];

  private wsSub?: Subscription;

  constructor(
    private auth: AuthService,
    private ws: WsNotificationService,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.notifSvc.listUnread().subscribe({ next: (l) => this.unread.set(l.length), error: () => {} });
    this.wsSub = this.ws.connect().subscribe(() => this.unread.update((n) => n + 1));
  }

  ngOnDestroy(): void { this.wsSub?.unsubscribe(); this.ws.disconnect(); }
  toggle(): void { this.collapsed.update((v) => !v); }
  logout(): void { this.auth.logout(); }
}
