import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { ProgrammingBoardPage } from './programming-board.page';
import { PROGRAMMING_COPY } from '../../../constants/programming.copy.constants';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgrammingBoardPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProgrammingBoardPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProgrammingBoardPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('deja la matrícula en la asignación de promoción o alumno', async () => {
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
    const fixture = TestBed.createComponent(ProgrammingBoardPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(fixture.componentInstance.needsSquadron()).toBe(false);
    expect(text).not.toContain(PROGRAMMING_COPY.tabPrograms);
    expect(text).not.toContain(PROGRAMMING_COPY.tabRoster);
    expect(text).not.toContain(PROGRAMMING_COPY.tabResults);
  });
});
