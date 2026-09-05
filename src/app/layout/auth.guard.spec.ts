import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard, operationalContextGuard } from './auth.guard';
import { LOGIN_ROUTE, PROFILE_CONTEXT_ROUTE } from './auth-routes.constants';
import { ClientSession } from './client-session.service';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '', children: [] }])],
    });
  });

  it('deja pasar si hay sesión', () => {
    TestBed.inject(ClientSession).signIn('Elena');
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('manda al acceso con el destino si no hay sesión', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/perfil/usuario' } as never),
    );
    expect(String(result)).toBe(
      String(router.createUrlTree([LOGIN_ROUTE], { queryParams: { next: '/perfil/usuario' } })),
    );
  });
});

describe('operationalContextGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '', children: [] }])],
    });
  });

  it('manda a perfilamiento si hay sesión sin contexto', () => {
    const router = TestBed.inject(Router);
    TestBed.inject(ClientSession).signIn('Elena');
    const result = TestBed.runInInjectionContext(() =>
      operationalContextGuard({} as never, { url: '/catalogo' } as never),
    );
    expect(String(result)).toBe(
      String(router.createUrlTree([PROFILE_CONTEXT_ROUTE], { queryParams: { next: '/catalogo' } })),
    );
  });
});
