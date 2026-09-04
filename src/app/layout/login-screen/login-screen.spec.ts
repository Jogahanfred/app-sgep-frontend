import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { ClientSession } from '../client-session.service';
import { LoginScreen } from './login-screen';
import { LOGIN_COPY } from './login-screen.copy.constants';

describe('LoginScreen', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    await TestBed.configureTestingModule({
      imports: [LoginScreen],
      providers: [provideRouter([{ path: 'perfil', children: [] }])],
    }).compileComponents();
  });

  it('muestra el diseño institucional y el formulario de acceso', async () => {
    const fixture = TestBed.createComponent(LoginScreen);
    fixture.componentRef.setInput('open', true);
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
  });

  it('mantiene la sesión existente al enviar credenciales válidas', async () => {
    const fixture = TestBed.createComponent(LoginScreen);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(ClientSession);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('nextUrl', '/perfil');
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ user: 'elena', password: 'secreto' });
    fixture.componentInstance.submit();

    expect(session.loggedIn()).toBe(true);
    expect(session.displayName()).toBe('Elena');
    expect(navigate).toHaveBeenCalledWith('/perfil');
  });

  it('no inicia sesión si el formulario es inválido', () => {
    const fixture = TestBed.createComponent(LoginScreen);
    const session = TestBed.inject(ClientSession);
    fixture.componentInstance.submit();
    expect(session.loggedIn()).toBe(false);
    expect(fixture.componentInstance.form.controls.user.touched).toBe(true);
  });
});
