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
    expect(text).toContain('Nuevo usuario');
    expect(text).toContain('Por página');
    expect(text).toContain('Mostrando 1-5 de 8');
    expect(root.querySelector('ui-table')).not.toBeNull();
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('pasa a la siguiente página del listado', async () => {
    const fixture = TestBed.createComponent(UsersListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toContain('Sofía');
    const next = root.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Sofía');
    expect(root.textContent).toContain('Mostrando 6-8 de 8');
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
