import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { TransactionService } from '../../../app/core/services/transaction';
import { CreateTransactionRequest, TransactionResponse } from '../../../app/core/models';

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;

  const API = 'http://localhost:8080';

  const mockTransaction: TransactionResponse = {
    id: 'tx-1',
    accountId: 'acc-1',
    tipo: 'DESPESA',
    status: 'CONFIRMADA',
    valor: 150.0,
    descricao: 'iFood',
    data: '2024-01-15',
    criadoEm: '2024-01-15T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TransactionService,
      ],
    });
    service = TestBed.inject(TransactionService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── list ────────────────────────────────────────────────────────────────

  it('list() envia GET com params de período e paginação', fakeAsync(() => {
    service.list('2024-01-01', '2024-01-31', 0, 20).subscribe();

    const req = http.expectOne(
      `${API}/transactions?page=0&size=20&de=2024-01-01&ate=2024-01-31`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
    tick();
  }));

  it('list() sem datas não envia params de período', fakeAsync(() => {
    service.list(undefined, undefined, 0, 20).subscribe();

    const req = http.expectOne((r) => r.url === `${API}/transactions`);
    expect(req.request.params.has('de')).toBeFalse();
    expect(req.request.params.has('ate')).toBeFalse();
    req.flush({ content: [], totalElements: 0 });
    tick();
  }));

  // ── create ──────────────────────────────────────────────────────────────

  it('create() envia POST com o body correto', fakeAsync(() => {
    const req: CreateTransactionRequest = {
      accountId: 'acc-1',
      tipo: 'DESPESA',
      valor: 150,
      data: '2024-01-15',
    };

    service.create(req).subscribe();

    const httpReq = http.expectOne(`${API}/transactions`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush(mockTransaction);
    tick();
  }));

  // ── update ──────────────────────────────────────────────────────────────

  it('update() envia PUT para o ID correto', fakeAsync(() => {
    service.update('tx-1', {
      tipo: 'DESPESA',
      status: 'CONFIRMADA',
      valor: 200,
      data: '2024-01-15',
    }).subscribe();

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockTransaction);
    tick();
  }));

  // ── delete ──────────────────────────────────────────────────────────────

  it('delete() envia DELETE para o ID correto', fakeAsync(() => {
    service.delete('tx-1').subscribe();

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  // ── get ─────────────────────────────────────────────────────────────────

  it('get() envia GET para o ID correto e retorna a transação', fakeAsync(() => {
    let result: TransactionResponse | undefined;

    service.get('tx-1').subscribe((t) => (result = t));

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTransaction);
    tick();

    expect(result).toEqual(mockTransaction);
  }));
});