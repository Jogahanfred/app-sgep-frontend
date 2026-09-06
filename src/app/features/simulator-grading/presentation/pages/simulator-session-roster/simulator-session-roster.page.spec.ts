import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { ActivatedRoute } from '@angular/router';
import { SimulatorSessionRosterPage } from './simulator-session-roster.page';
import { SIMULATOR_GRADING_COPY } from '../../../constants/simulator-grading.copy.constants';

function stubDialog(): void {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  }
}

async function waitReady(fixture: ComponentFixture<SimulatorSessionRosterPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('SimulatorSessionRosterPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [SimulatorSessionRosterPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                programId: 'prg-ppl',
                promotionId: 'promotion-2026-i',
                sessionId: 'sp-ppl-sim-proc',
              }),
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

  it('muestra la matriz de notas del simulador', async () => {
    const fixture = TestBed.createComponent(SimulatorSessionRosterPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Simulador');
    expect(root.textContent).toContain('Iván Rubio Nadal');
    expect(root.textContent).toContain(SIMULATOR_GRADING_COPY.averageLabel);
    const page = fixture.componentInstance;
    const ivan = page.students().find((item) => item.userId === 'usr-ivan-rubio-nadal');
    expect(ivan).toBeTruthy();
    expect(root.querySelector('.gr__avg app-button')).toBeNull();
    const input = root.querySelector('tbody tr:first-child input.gr__mark') as HTMLInputElement;
    input.value = '18';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(page.isDirty(ivan!)).toBe(true);
    expect(root.querySelector('.gr__avg app-button')?.textContent).toContain(SIMULATOR_GRADING_COPY.save);
  });
});
