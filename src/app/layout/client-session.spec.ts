import { TestBed } from '@angular/core/testing';
import { SESSION_DEMO_USER_ID } from '@core/domain/entities';
import { ClientSession } from './client-session.service';

describe('ClientSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persiste la sesión para recargar o abrir otra ruta', () => {
    const first = TestBed.inject(ClientSession);
    first.signIn('Elena', SESSION_DEMO_USER_ID);
    expect(JSON.parse(localStorage.getItem('siga-session') ?? '{}').userId).toBe(SESSION_DEMO_USER_ID);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ClientSession);
    expect(restored.loggedIn()).toBe(true);
    expect(restored.userId()).toBe(SESSION_DEMO_USER_ID);
  });

  it('elimina la sesión de localStorage al cerrar sesión', () => {
    const session = TestBed.inject(ClientSession);
    session.signIn('Elena', SESSION_DEMO_USER_ID);
    expect(localStorage.getItem('siga-session')).toBeTruthy();
    session.signOut();
    expect(localStorage.getItem('siga-session')).toBeNull();
    expect(sessionStorage.getItem('siga-session')).toBeNull();
    expect(session.loggedIn()).toBe(false);
  });
});
