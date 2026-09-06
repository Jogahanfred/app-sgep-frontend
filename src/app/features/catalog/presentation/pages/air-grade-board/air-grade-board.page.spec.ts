import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { AIR_GRADE_COPY } from '../../../constants/air-grades.copy.constants';
import { AirGradeBoardPage } from './air-grade-board.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AirGradeBoardPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('AirGradeBoardPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AirGradeBoardPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ userId: 'usr-sofia-vidal', programId: 'prg-heli-2023' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
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
  });

  it('muestra fases, subfases y fichas de misión clicables', async () => {
    const fixture = TestBed.createComponent(AirGradeBoardPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(page.loadState()).toBe('ready');
    expect(page.program()?.phases.length).toBeGreaterThan(0);
    expect(root.querySelector('.ap__head h1')?.textContent).toContain('Curso Piloto de Helicóptero');
    expect(root.querySelector('app-button')?.textContent).toContain(AIR_GRADE_COPY.back);
    expect(root.querySelector('app-accordion')).not.toBeNull();
    expect(root.textContent).toContain(AIR_GRADE_COPY.legendTitle);
    expect(root.textContent).not.toContain(AIR_GRADE_COPY.tileStatuses.outstanding);
    expect(root.querySelector('.agb__legend')).not.toBeNull();
    expect(root.textContent).toMatch(/1\.\s/);
    expect(root.textContent).toMatch(/1\.1\s/);
    const tile = root.querySelector('.agb__tile:not(:disabled)') as HTMLButtonElement | null;
    expect(tile).not.toBeNull();
    expect(tile?.textContent).toMatch(/M\d+/);
  });
});
