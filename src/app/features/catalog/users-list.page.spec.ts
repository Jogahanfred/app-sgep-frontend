import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { UsersListPage } from './users-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<UsersListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('UsersListPage', () => {
  beforeEach(async () => {
    if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
      };
    }
    await TestBed.configureTestingModule({
      imports: [UsersListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('pinta la tabla del catálogo de personas', async () => {
    const fixture = TestBed.createComponent(UsersListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Usuarios');
    expect(text).toContain('Elena');
    expect(text).toContain('Martín Ruiz');
    expect(root.querySelector('input[type="search"]')?.getAttribute('placeholder')).toContain('nombres');
    expect(text).toContain('Añadir');
    expect(text).toContain('Detalle');
    expect(text).toContain('Modificar');
    expect(text).toContain('Baja');
    expect(text).toContain('Por página:');
    expect(text).toContain('Mostrando 1 - 10 de 32');
    expect(root.querySelector('ui-table')).not.toBeNull();
    expect(root.querySelector('[aria-label="Primera página"]')).not.toBeNull();
    expect(root.querySelector('app-user-quick-create')).toBeNull();
    expect(root.querySelector('a[href="/catalogo/usuarios/nuevo"]')).not.toBeNull();
  });

  it('pide confirmación antes de dar de baja', async () => {
    const fixture = TestBed.createComponent(UsersListPage);
    await waitReady(fixture);
    fixture.componentInstance.selectedId.set('usr-elena-martin');
    fixture.componentInstance.askDeactivate();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Confirmar baja');
    expect(text).toContain('Elena');
    expect(text).toContain('Dar de baja');
    fixture.componentInstance.closeConfirm();
    fixture.detectChanges();
    expect(fixture.componentInstance.users().find((user) => user.id === 'usr-elena-martin')?.status).toBe('active');
  });

  it('lleva el alta a una pantalla del catálogo', async () => {
    const fixture = TestBed.createComponent(UsersListPage);
    await waitReady(fixture);
    const add = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/catalogo/usuarios/nuevo"]',
    ) as HTMLAnchorElement | null;
    expect(add?.textContent).toContain('Añadir');
  });

  it('filtra por estado inactivo', async () => {
    const fixture = TestBed.createComponent(UsersListPage);
    await waitReady(fixture);
    fixture.componentInstance.statusFilter.set('inactive');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mario');
    expect(text).toContain('Irene');
    expect(text).not.toContain('Sofía');
  });
});
