import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthenticateUser } from '@core/application';
import { CORE_PROVIDERS } from '@core/di/providers';
import { PROFILE_CONTEXT_ROUTE } from '../auth-routes.constants';
import { ClientSession } from '../client-session.service';
import { LoginScreen } from './login-screen';
import { LOGIN_COPY } from './login-screen.copy.constants';

describe('LoginScreen', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginScreen],
      providers: [
        provideRouter([
          { path: 'perfilamiento', children: [] },
          { path: 'login', children: [] },
        ]),
        ...CORE_PROVIDERS,
        {
          provide: AuthenticateUser,
          useValue: {
            execute: () =>
              of({
                userId: 'usr-elena-martin',
                displayName: 'Elena',
                roleCode: 'ADSYS',
                assignedUnitId: null,
                assignedSquadronId: null,
              }),
          },
        },
      ],
    }).compileComponents();
  });

  it('muestra el diseño institucional y el formulario de acceso', async () => {
    const fixture = TestBed.createComponent(LoginScreen);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(LOGIN_COPY.title);
    expect(text).toContain(LOGIN_COPY.mottoAccent);
    expect(text).toContain(LOGIN_COPY.brandName);
    expect(text).toContain(LOGIN_COPY.submit);
    expect(text).not.toContain('Token PKI');
    expect(text).not.toContain('FAP-ID');
    expect((fixture.nativeElement as HTMLElement).querySelector('#login-user')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('#login-pass')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('dialog')).toBeNull();
  });

  it('mantiene la sesión existente al enviar credenciales válidas', async () => {
    const fixture = TestBed.createComponent(LoginScreen);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(ClientSession);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ user: 'elena', password: 'secreto' });
    await fixture.componentInstance.submit();

    expect(session.loggedIn()).toBe(true);
    expect(session.displayName()).toBe('Elena');
    expect(session.roleCode()).toBe('ADSYS');
    expect(session.contextConfirmed()).toBe(false);
    expect(navigate).toHaveBeenCalledWith([PROFILE_CONTEXT_ROUTE], { queryParams: { next: '/perfil' } });
  });

  it('no inicia sesión si el formulario es inválido', async () => {
    const fixture = TestBed.createComponent(LoginScreen);
    const session = TestBed.inject(ClientSession);
    await fixture.componentInstance.submit();
    expect(session.loggedIn()).toBe(false);
    expect(fixture.componentInstance.form.controls.user.touched).toBe(true);
  });
});
