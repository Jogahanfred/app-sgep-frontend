import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { ClientSession } from './client-session.service';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '', children: [] }])],
    });
  });

  it('deja pasar si hay sesión', () => {
    TestBed.inject(ClientSession).signIn('Elena');
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('manda al inicio con el destino si no hay sesión', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/perfil/usuario' } as never),
    );
    expect(String(result)).toBe(String(router.createUrlTree(['/'], { queryParams: { next: '/perfil/usuario' } })));
  });
});
