import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { catalogMissionKey } from '@core/domain/services/admin-catalog';
import { ProgramStandardsPage } from './program-standards.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

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

async function waitReady(fixture: ComponentFixture<ProgramStandardsPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

async function createFixture(): Promise<ComponentFixture<ProgramStandardsPage>> {
  stubDialog();
  await TestBed.configureTestingModule({
    imports: [ProgramStandardsPage],
    providers: [
      provideRouter([]),
      ...CORE_PROVIDERS,
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: 'prg-ppl' }), data: {} } },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ProgramStandardsPage);
  await waitReady(fixture);
  return fixture;
}

describe('ProgramStandardsPage', () => {
  it('presenta el mapa del programa antes de abrir una subfase', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';

    expect(text).toContain('Estándares de Piloto privado · ala fija');
    expect(root.querySelector('.ps__title')?.textContent?.trim()).toBe(
      'Estándares de Piloto privado · ala fija',
    );
    expect(root.querySelector('.ps__eyebrow')).toBeNull();
    expect(text).not.toContain('Plan de evaluación');
    expect(text).toContain('Mapa del programa');
    expect(text).toContain('TEO · Teoría en aula');
    expect(text).toContain('BAS · Vuelo básico');
    expect(text).toContain('Selecciona una subfase del programa');
    expect(page.activeSubphase()).toBeNull();
    expect(root.querySelector('.saw__matrix')).toBeNull();
  });

  it('muestra todas las misiones y maniobras de la subfase en una sola matriz de calificación', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;

    page.selectSubphase('sp-ppl-dual');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(page.activeSubphase()?.label).toBe('DUAL · Dual');
    expect(root.querySelector('#saw-title')?.textContent?.trim()).toBe('Matriz de calificación');
    expect(text).not.toContain('Matriz DIRBE');
    expect(text).toContain('LOC');
    expect(text).toContain('Circuito corto');
    expect(text).toContain('Circuito largo');
    expect(text).toContain('Despegue normal');
    expect(text).toContain('Aterrizaje estabilizado');
    expect(text).toContain('Vuelo visual');
    expect(root.querySelectorAll('app-dirbe-cell-selector')).toHaveLength(6);
    expect(root.querySelector('.saw')?.textContent).not.toContain('cruces definidos');
    expect(root.querySelector('.saw')?.textContent).not.toMatch(/\d+ misiones · \d+ maniobras/);
  });

  it('amplía únicamente la matriz y conserva la edición de sus cuadrantes', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;

    page.selectSubphase('sp-ppl-dual');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const expandButton = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Ampliar matriz'),
    );
    expect(expandButton).toBeTruthy();
    expandButton?.click();
    fixture.detectChanges();

    const expanded = root.querySelector('.saw__expanded') as HTMLElement;
    expect(expanded).not.toBeNull();
    expect(expanded.querySelector('app-program-standard-navigator')).toBeNull();
    expect(root.querySelectorAll('app-program-standard-matrix')).toHaveLength(2);
    expect(expanded.querySelectorAll('app-dirbe-cell-selector')).toHaveLength(6);
    expect(expanded.querySelector('.saw__expanded-summary')).toBeNull();
    expect(expanded.textContent).not.toContain('cruces definidos');
    expect(expanded.textContent).not.toMatch(/\d+ misiones · \d+ maniobras/);

    const firstExpandedCell = expanded.querySelector(
      'app-dirbe-cell-selector button',
    ) as HTMLButtonElement;
    firstExpandedCell.click();
    fixture.detectChanges();

    expect(root.querySelector('app-dirbe-level-picker')).not.toBeNull();
    (root.querySelector('.dlp__card--e') as HTMLButtonElement).click();
    fixture.detectChanges();
    const apply = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Aplicar estándar'),
    );
    apply?.click();
    fixture.detectChanges();

    expect(firstExpandedCell.classList.contains('dcs--e')).toBe(true);
    expect(page.dirtySubphaseIds().has('sp-ppl-dual')).toBe(true);
  });

  it('abre un modal con cards desde el cuadrante y aplica el estándar elegido', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;

    page.selectSubphase('sp-ppl-dual');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const firstCell = root.querySelector('app-dirbe-cell-selector button') as HTMLButtonElement;
    expect(root.querySelector('app-dirbe-cell-selector select')).toBeNull();
    firstCell.click();
    fixture.detectChanges();

    expect(root.querySelector('app-dirbe-level-picker')).not.toBeNull();
    expect(root.querySelectorAll('.dlp__card')).toHaveLength(5);

    (root.querySelector('.dlp__card--e') as HTMLButtonElement).click();
    fixture.detectChanges();
    const apply = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Aplicar estándar'),
    );
    apply?.click();
    fixture.detectChanges();

    expect(root.querySelector('app-dirbe-level-picker')).toBeNull();
    expect(firstCell.classList.contains('dcs--e')).toBe(true);
    expect(page.dirtySubphaseIds().has('sp-ppl-dual')).toBe(true);
  });

  it('actualiza únicamente el nivel DIRBE del cruce elegido y marca su subfase', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;
    const target = {
      subphaseId: 'sp-ppl-dual',
      missionKey: catalogMissionKey('mt-local'),
      maneuverId: 'man-toff',
      level: 'E' as const,
    };

    expect(page.dirtySubphaseIds().size).toBe(0);
    page.selectSubphase(target.subphaseId);
    page.updateDirbeLevel(target);
    fixture.detectChanges();

    const updated = page.assignments().find(
      (assignment) =>
        assignment.subphaseId === target.subphaseId &&
        assignment.missionKey === target.missionKey &&
        assignment.maneuverId === target.maneuverId,
    );
    expect(updated?.dirbeLevel).toBe('E');
    expect(updated?.standardIds).toEqual(['std-toff']);
    expect(page.dirtySubphaseIds().has('sp-ppl-dual')).toBe(true);
    expect(page.dirtySubphaseIds().has('sp-ppl-brf')).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cambios sin guardar');
  });

  it('guarda solo la subfase solicitada y mantiene abierta su matriz', async () => {
    const fixture = await createFixture();
    const page = fixture.componentInstance;

    page.selectSubphase('sp-ppl-dual');
    page.updateDirbeLevel({
      subphaseId: 'sp-ppl-dual',
      missionKey: catalogMissionKey('mt-local'),
      maneuverId: 'man-toff',
      level: 'E',
    });
    page.updateDirbeLevel({
      subphaseId: 'sp-ppl-brf',
      missionKey: catalogMissionKey('mt-local'),
      maneuverId: 'man-land',
      level: 'E',
    });
    expect(page.dirtySubphaseIds()).toEqual(new Set(['sp-ppl-brf', 'sp-ppl-dual']));

    await page.saveSubphase('sp-ppl-dual');
    fixture.detectChanges();

    expect(page.activeSubphaseId()).toBe('sp-ppl-dual');
    expect(page.dirtySubphaseIds().has('sp-ppl-dual')).toBe(false);
    expect(page.dirtySubphaseIds().has('sp-ppl-brf')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Subfase guardada');
  });
});
