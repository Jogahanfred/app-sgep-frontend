import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { EVALUATION_COUNCIL_COPY } from '../../../constants/evaluation-council.copy.constants';
import { EvaluationCouncilListPage } from './evaluation-council-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

const adsys: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

async function waitReady(fixture: ComponentFixture<EvaluationCouncilListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('EvaluationCouncilListPage', () => {
  it('lista alumnos sobre el tope de reprobaciones', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [EvaluationCouncilListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(adsys);

    const fixture = TestBed.createComponent(EvaluationCouncilListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.textContent).toContain(EVALUATION_COUNCIL_COPY.tableHeading);
    expect(root.textContent).toContain('Diego');
    expect(root.textContent).not.toContain('Sofía Vidal');
    expect(root.textContent).toContain(EVALUATION_COUNCIL_COPY.openSession);
  });
});
