import { TestBed } from '@angular/core/testing';
import { SESSION_DEMO_USER_ID } from '@core/domain/entities';
import { ClientSession } from './client-session.service';

describe('ClientSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persiste la sesión para recargar o abrir otra ruta', () => {
    const first = TestBed.inject(ClientSession);
    first.signIn('Elena', SESSION_DEMO_USER_ID);
    expect(JSON.parse(sessionStorage.getItem('siga-session') ?? '{}').userId).toBe(SESSION_DEMO_USER_ID);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ClientSession);
    expect(restored.loggedIn()).toBe(true);
    expect(restored.userId()).toBe(SESSION_DEMO_USER_ID);
  });
});
