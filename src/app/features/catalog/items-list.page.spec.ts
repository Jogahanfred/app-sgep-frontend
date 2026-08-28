import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ItemsListPage } from './items-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ItemsListPage>): Promise<void> {
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
    imports: [ItemsListPage],
    providers: [
      provideRouter([]),
      ...CORE_PROVIDERS,
      { provide: ActivatedRoute, useValue: { snapshot: { data: { catalog } } } },
    ],
  }).compileComponents();
}

describe('ItemsListPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lista los roles del catálogo', async () => {
    await configure('roles');
    const fixture = TestBed.createComponent(ItemsListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Roles de usuario');
    expect(text).toContain('Administrador');
    expect(text).toContain('Director Académico');
    expect(text).toContain('Alumno');
    expect(text).toContain('Por página:');
    expect(root.querySelector('ui-table')).not.toBeNull();
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('lista las especialidades del catálogo', async () => {
    await configure('specialties');
    const fixture = TestBed.createComponent(ItemsListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Especialidades');
    expect(text).toContain('Pilotaje');
  });
});
