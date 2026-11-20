import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Subscription } from './subscription';
import { SubscriptionService } from '../../core/services/subscription';

describe('SubscriptionComponent', () => {
  let fixture: ComponentFixture<Subscription>;
  let component: Subscription;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Subscription);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o componente', () => {
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/subscriptions/me').flush({
      plano: 'FREE', status: 'ACTIVE', isPro: false,
      diasParaExpirar: -1, limiteContas: 3, limiteTransacoesMes: 100,
    });
    expect(component).toBeTruthy();
  });

  it('limiteContasLabel retorna "3 contas" para FREE', () => {
    component['plan'].set({ plano: 'FREE', status: 'ACTIVE', isPro: false, diasParaExpirar: -1, limiteContas: 3, limiteTransacoesMes: 100 } as any);
    expect(component.limiteContasLabel()).toBe('3 contas');
  });

  it('limiteContasLabel retorna "Ilimitado" para PRO', () => {
    component['plan'].set({ plano: 'PRO', status: 'ACTIVE', isPro: true, diasParaExpirar: 30, limiteContas: 2147483647, limiteTransacoesMes: 2147483647 } as any);
    expect(component.limiteContasLabel()).toBe('Ilimitado');
  });

  it('diasLabel retorna string de dias para PRO ativo', () => {
    component['plan'].set({ plano: 'PRO', status: 'ACTIVE', isPro: true, diasParaExpirar: 15, limiteContas: 2147483647, limiteTransacoesMes: 2147483647 } as any);
    expect(component.diasLabel()).toBe('15 dias restantes');
  });
});
