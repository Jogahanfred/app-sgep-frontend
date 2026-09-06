import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { SimulatorGradingInboxPage } from './simulator-grading-inbox.page';
import { SIMULATOR_GRADING_COPY, SIMULATOR_GRADING_ROUTES } from '../../../constants/simulator-grading.copy.constants';

async function waitReady(fixture: ComponentFixture<SimulatorGradingInboxPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('SimulatorGradingInboxPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SimulatorGradingInboxPage],
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
  });

  it('pide programa y promoción antes de mostrar las sesiones', async () => {
    const fixture = TestBed.createComponent(SimulatorGradingInboxPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(SIMULATOR_GRADING_COPY.lead);
    expect(root.textContent).toContain(SIMULATOR_GRADING_COPY.pickFilters);
    const page = fixture.componentInstance;
    page.onProgram('prg-ppl');
    page.onPromotion('promotion-2026-i');
    fixture.detectChanges();
    expect(root.textContent).toContain('Simulador');
    expect(root.textContent).toContain(SIMULATOR_GRADING_COPY.colMissions);
    expect(root.querySelector('.gg__table')).not.toBeNull();
    expect((root.querySelector('.gg__table tbody tr') as HTMLElement).style.getPropertyValue('--i')).toBe('0');
  });

  it('abre el acta de la sesión seleccionada', async () => {
    const fixture = TestBed.createComponent(SimulatorGradingInboxPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const router = TestBed.inject(Router);
    page.onProgram('prg-ppl');
    page.onPromotion('promotion-2026-i');
    fixture.detectChanges();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const sim = page.sessions().find((item) => item.code === 'SIM');
    page.openSession(sim!);
    expect(navigate).toHaveBeenCalledWith(SIMULATOR_GRADING_ROUTES.session('prg-ppl', 'promotion-2026-i', sim!.id));
  });
});
