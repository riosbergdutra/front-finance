import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HomeComponent } from './home';
import { AuthService } from '../../core/services/auth';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir 6 features', () => {
    expect(component.features.length).toBe(6);
  });

  it('deve exibir 2 planos', () => {
    expect(component.plans.length).toBe(2);
  });

  it('o plano PRO deve ter highlight=true', () => {
    const pro = component.plans.find((p) => p.name === 'PRO');
    expect(pro?.highlight).toBeTrue();
  });

  it('isAuth retorna false quando não autenticado', () => {
    const auth = TestBed.inject(AuthService);
    spyOn(auth, 'isAuthenticated').and.returnValue(false as any);
    expect(component.isAuth).toBeFalse();
  });
});
