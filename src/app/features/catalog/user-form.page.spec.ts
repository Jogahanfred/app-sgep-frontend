import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { UserFormPage } from './user-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<UserFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('UserFormPage', () => {
  it('es una pantalla de alta con pestañas, sin modal', async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null }, data: {} } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserFormPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Nuevo usuario');
    expect(text).toContain('Datos generales');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(root.querySelector('app-modal')).toBeNull();
  });
});
