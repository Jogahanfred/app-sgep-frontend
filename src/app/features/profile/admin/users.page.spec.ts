import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { UsersPage } from './users.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<UsersPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('UsersPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('pinta la tabla de personas y el buscador', async () => {
    const fixture = TestBed.createComponent(UsersPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Usuarios');
    expect(text).toContain('Elena');
    expect(text).toContain('Martín Ruiz');
    expect(text).toContain('Buscar por nombres');
    expect(text).toContain('Nuevo usuario');
  });

  it('filtra por estado inactivo', async () => {
    const fixture = TestBed.createComponent(UsersPage);
    await waitReady(fixture);
    fixture.componentInstance.statusFilter.set('inactive');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mario');
    expect(text).toContain('Irene');
    expect(text).not.toContain('Sofía');
  });

  it('abre el modal de alta con las tres pestañas', async () => {
    const fixture = TestBed.createComponent(UsersPage);
    await waitReady(fixture);
    fixture.componentInstance.openCreate();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nuevo usuario');
    expect(text).toContain('Datos generales');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Nombres');
    expect(text).toContain('DNI / Documento');
  });
});
