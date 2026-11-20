import { TestBed } from '@angular/core/testing';
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

  it('list() envia GET com params de período e paginação', () => {
    service.list('2024-01-01', '2024-01-31', 0, 20).subscribe();

    const req = http.expectOne(
      `${API}/transactions?page=0&size=20&de=2024-01-01&ate=2024-01-31`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('list() sem datas não envia params de período', () => {
    service.list(undefined, undefined, 0, 20).subscribe();

    const req = http.expectOne((r) => r.url === `${API}/transactions`);
    expect(req.request.params.has('de')).toBe(false);
    expect(req.request.params.has('ate')).toBe(false);
    req.flush({ content: [], totalElements: 0 });
  });

  // ── create ──────────────────────────────────────────────────────────────

  it('create() envia POST com o body correto', () => {
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
  });

  // ── update ──────────────────────────────────────────────────────────────

  it('update() envia PUT para o ID correto', () => {
    service.update('tx-1', {
      tipo: 'DESPESA',
      status: 'CONFIRMADA',
      valor: 200,
      data: '2024-01-15',
    }).subscribe();

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockTransaction);
  });

  // ── delete ──────────────────────────────────────────────────────────────

  it('delete() envia DELETE para o ID correto', () => {
    service.delete('tx-1').subscribe();

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── get ─────────────────────────────────────────────────────────────────

  it('get() envia GET para o ID correto e retorna a transação', () => {
    let result: TransactionResponse | undefined;

    service.get('tx-1').subscribe((t) => (result = t));

    const req = http.expectOne(`${API}/transactions/tx-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTransaction);

    expect(result).toEqual(mockTransaction);
  });
});