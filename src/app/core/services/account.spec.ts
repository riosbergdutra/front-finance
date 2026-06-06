import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AccountService } from '../../../app/core/services/account';
import { AccountResponse } from '../../../app/core/models';

describe('AccountService', () => {
  let service: AccountService;
  let http: HttpTestingController;

  const API = 'http://localhost:8080';

  const mockAccount: AccountResponse = {
    id: 'acc-1',
    name: 'Conta Corrente',
    type: 'CHECKING',
    balance: 5000,
    currency: 'BRL',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AccountService,
      ],
    });
    service = TestBed.inject(AccountService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() retorna array de contas', fakeAsync(() => {
    let result: AccountResponse[] | undefined;
    service.list().subscribe((r) => (result = r));

    const req = http.expectOne(`${API}/accounts`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAccount]);
    tick();

    expect(result).toEqual([mockAccount]);
  }));

  it('create() envia POST com body correto', fakeAsync(() => {
    service.create({ name: 'Nova Conta', type: 'SAVINGS', initialBalance: 0 }).subscribe();

    const req = http.expectOne(`${API}/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Nova Conta');
    req.flush(mockAccount);
    tick();
  }));

  it('update() envia PUT para o ID correto', fakeAsync(() => {
    service.update('acc-1', { name: 'Atualizada', type: 'CHECKING' }).subscribe();

    const req = http.expectOne(`${API}/accounts/acc-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockAccount);
    tick();
  }));

  it('deactivate() envia DELETE para o ID correto', fakeAsync(() => {
    service.deactivate('acc-1').subscribe();

    const req = http.expectOne(`${API}/accounts/acc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));
});