import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeAll, vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { CatalogPage } from './catalog.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

async function waitReady(fixture: ComponentFixture<CatalogPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

function configure(catalog: 'roles' | 'specialties'): Promise<void> {
  return TestBed.configureTestingModule({
    imports: [CatalogPage],
    providers: [
      provideRouter([]),
      ...CORE_PROVIDERS,
      { provide: ActivatedRoute, useValue: { snapshot: { data: { catalog } } } },
    ],
  }).compileComponents();
}

describe('CatalogPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lista los roles de ejemplo', async () => {
    await configure('roles');
    const fixture = TestBed.createComponent(CatalogPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Roles de usuario');
    expect(text).toContain('Administrador');
    expect(text).toContain('Director Académico');
    expect(text).toContain('Jefe de Instrucción');
    expect(text).toContain('Instructor');
    expect(text).toContain('Alumno');
  });

  it('lista las especialidades', async () => {
    await configure('specialties');
    const fixture = TestBed.createComponent(CatalogPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Especialidades');
    expect(text).toContain('Pilotaje');
    expect(text).toContain('Gestión académica');
  });
});
