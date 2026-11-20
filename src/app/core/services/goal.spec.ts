import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GoalService } from './goal';
import { GoalResponse } from '../models';

const MOCK: GoalResponse = {
  id: 'g1', nome: 'Viagem', valorAlvo: 5000, valorAtual: 1000,
  percentualConcluido: 20, concluida: false, criadoEm: '2025-01-01T00:00:00Z',
};

describe('GoalService', () => {
  let service: GoalService;
  let http: HttpTestingController;
  const API = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), GoalService] });
    service = TestBed.inject(GoalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() chama GET /goals', fakeAsync(() => {
    let result: GoalResponse[] = [];
    service.list().subscribe((r) => (result = r));
    http.expectOne((req) => req.url === `${API}/goals` && req.method === 'GET').flush([MOCK]);
    tick();
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe('Viagem');
  }));

  it('create() chama POST /goals', fakeAsync(() => {
    let result: GoalResponse | null = null;
    service.create({ nome: 'Viagem', valorAlvo: 5000 }).subscribe((r) => (result = r));
    http.expectOne(`${API}/goals`).flush(MOCK);
    tick();
    expect(result).toBeTruthy();
  }));

  it('depositar() chama POST /goals/:id/depositar', fakeAsync(() => {
    let result: GoalResponse | null = null;
    service.depositar('g1', 500).subscribe((r) => (result = r));
    const req = http.expectOne(`${API}/goals/g1/depositar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ valor: 500 });
    req.flush({ ...MOCK, valorAtual: 1500, percentualConcluido: 30 });
    tick();
    expect(result).toBeTruthy();
  }));

  it('sacar() chama POST /goals/:id/sacar', fakeAsync(() => {
    service.sacar('g1', 200).subscribe();
    const req = http.expectOne(`${API}/goals/g1/sacar`);
    expect(req.request.method).toBe('POST');
    req.flush(MOCK);
    tick();
  }));

  it('concluir() chama POST /goals/:id/concluir', fakeAsync(() => {
    service.concluir('g1').subscribe();
    const req = http.expectOne(`${API}/goals/g1/concluir`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...MOCK, concluida: true });
    tick();
  }));

  it('delete() chama DELETE /goals/:id', fakeAsync(() => {
    service.delete('g1').subscribe();
    http.expectOne(`${API}/goals/g1`).flush(null);
    tick();
  }));
});
