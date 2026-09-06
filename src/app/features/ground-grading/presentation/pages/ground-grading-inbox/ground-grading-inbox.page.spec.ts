import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { GroundGradingInboxPage } from './ground-grading-inbox.page';
import { GROUND_GRADING_COPY, GROUND_GRADING_ROUTES } from '../../../constants/ground-grading.copy.constants';

async function waitReady(fixture: ComponentFixture<GroundGradingInboxPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('GroundGradingInboxPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [GroundGradingInboxPage],
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

  it('pide programa y promoción antes de mostrar las asignaturas', async () => {
    const fixture = TestBed.createComponent(GroundGradingInboxPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(GROUND_GRADING_COPY.lead);
    expect(root.textContent).toContain(GROUND_GRADING_COPY.pickFilters);
    const page = fixture.componentInstance;
    page.onProgram('prg-ppl');
    page.onPromotion('promotion-2026-i');
    fixture.detectChanges();
    expect(root.textContent).toContain('Teoría Aeronáutica I');
    expect(root.textContent).toContain(GROUND_GRADING_COPY.colCode);
    expect(root.textContent).toContain(GROUND_GRADING_COPY.colTheory);
    expect(root.querySelector('.gg__table')).not.toBeNull();
    expect(root.querySelector('.mx__pager')).toBeNull();
    expect((root.querySelector('.gg__table tbody tr') as HTMLElement).style.getPropertyValue('--i')).toBe('0');
  });

  it('abre el acta del curso seleccionado', async () => {
    const fixture = TestBed.createComponent(GroundGradingInboxPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const router = TestBed.inject(Router);
    page.onProgram('prg-ppl');
    page.onPromotion('promotion-2026-i');
    fixture.detectChanges();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const tea = page.courses().find((item) => item.code === 'TEA');
    page.openCourse(tea!);
    expect(navigate).toHaveBeenCalledWith(GROUND_GRADING_ROUTES.course('prg-ppl', 'promotion-2026-i', tea!.id));
  });
});
