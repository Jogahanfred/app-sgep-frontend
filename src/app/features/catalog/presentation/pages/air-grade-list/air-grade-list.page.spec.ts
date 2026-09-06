import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { AirGradeListPage } from './air-grade-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AirGradeListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('AirGradeListPage', () => {
  it('muestra los programas del alumno en tarjetas con imagen', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AirGradeListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext({
      userId: 'usr-elena-martin',
      displayName: 'Elena Martín Ruiz',
      roleCode: 'ADSYS',
      assignedUnitId: null,
      assignedSquadronId: null,
      unitId: 'unit-norte',
      squadronId: 'sq-alfa',
      coversAllSquadrons: false,
    });
    const fixture = TestBed.createComponent(AirGradeListPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(page.loadState()).toBe('ready');
    expect(page.programs().length).toBeGreaterThan(0);
    expect(root.querySelectorAll('ui-program-card').length).toBe(page.programs().length);
    expect(root.querySelector('ui-program-card img')).not.toBeNull();
    expect(root.querySelector('table')).toBeNull();
  });
});
