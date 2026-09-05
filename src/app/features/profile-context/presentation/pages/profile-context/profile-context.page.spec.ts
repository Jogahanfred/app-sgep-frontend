import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { ProfileContextPage } from './profile-context.page';
import { PROFILE_CONTEXT_COPY } from '../../../constants/profile-context.copy.constants';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProfileContextPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.status() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProfileContextPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfileContextPage],
      providers: [provideRouter([{ path: 'perfil', children: [] }]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).signInIdentity({
      userId: 'usr-elena-martin',
      displayName: 'Elena Martín Ruiz',
      roleCode: 'ADSYS',
      assignedUnitId: null,
      assignedSquadronId: null,
    });
  });

  it('muestra el perfilamiento de ADSYS con unidad y escuadrón seleccionables', async () => {
    const fixture = TestBed.createComponent(ProfileContextPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(PROFILE_CONTEXT_COPY.title);
    expect(text).toContain('Elena Martín Ruiz');
    expect(text).toContain(PROFILE_CONTEXT_COPY.unitLabel);
    expect(text).not.toContain('ADSYS');
    expect(text).not.toContain('NIVEL V');
    expect(text).toContain('Grupo Aéreo N.º 51');
    expect(text).toContain('Grupo Aéreo N.º 8');
    expect(text).not.toContain('Escuadrón Aéreo 510');
    fixture.componentInstance.selectUnit('unit-ga-51');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escuadrón Aéreo 510');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escuadrón Aéreo 511');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(PROFILE_CONTEXT_COPY.continue);
    expect(fixture.componentInstance.snapshot()?.requirements.allowUnitChange).toBe(true);
  });
});
