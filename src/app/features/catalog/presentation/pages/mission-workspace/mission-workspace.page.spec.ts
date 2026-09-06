import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { ActivatedRoute } from '@angular/router';
import { DIRBE_LEVELS } from '@core/domain/entities';
import { MissionWorkspacePage } from './mission-workspace.page';
import { MISSION_WORKSPACE_COPY } from './mission-workspace.copy.constants';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<MissionWorkspacePage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loading() && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('MissionWorkspacePage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MissionWorkspacePage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'execution-dispatch-ready' }) },
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

  it('carga la hoja de calificación y desaprueba si hay P', async () => {
    const fixture = TestBed.createComponent(MissionWorkspacePage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;
    expect(page.error()).toBeNull();
    expect(root.textContent).toContain(MISSION_WORKSPACE_COPY.pageTitle);
    expect(root.textContent).toContain(MISSION_WORKSPACE_COPY.sheetKicker);
    expect(root.textContent).toContain(MISSION_WORKSPACE_COPY.causeLabel);
    expect(page.rows().length).toBeGreaterThan(0);
    const first = page.rows()[0]!;
    page.setGrade(first.maneuver.id, 'P');
    fixture.detectChanges();
    expect(page.failedByDangerous()).toBe(true);
    expect(page.form.controls.result.value).toBe('failed');
    expect(root.textContent).toContain(MISSION_WORKSPACE_COPY.failedBanner);
    expect(root.querySelector('.mw__expected')).not.toBeNull();
    expect(root.querySelector('.mw__comments')).not.toBeNull();
    const head = root.querySelector('.acc__head') as HTMLElement;
    expect(head.lastElementChild?.classList.contains('acc__chevron')).toBe(true);
    expect(root.querySelector('.ap__head')?.textContent).not.toContain(MISSION_WORKSPACE_COPY.closeMission);
    expect(root.querySelector('.mw__signs')?.textContent).toContain(MISSION_WORKSPACE_COPY.closeMission);
    expect(page.canSignInstructor()).toBe(true);
    expect(page.canSignStudent()).toBe(false);
    const levels = new Set(page.rows().map((row) => row.expectedStandard).filter(Boolean));
    expect([...levels].some((level) => level === 'D' || level === 'I' || level === 'R' || level === 'B')).toBe(true);
  });

  it('muestra Guardar al anotar y COR solo después de guardar', async () => {
    const fixture = TestBed.createComponent(MissionWorkspacePage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;
    const first = page.rows()[0]!;
    const saveButton = () =>
      Array.from(root.querySelectorAll('button')).find((button) => button.textContent?.trim() === MISSION_WORKSPACE_COPY.save);

    expect(saveButton()).toBeUndefined();
    expect(root.querySelector('.mw__cor')).toBeNull();

    page.notesOf(first.maneuver.id).cause.setValue('Desviación de rumbo');
    fixture.detectChanges();
    expect(saveButton()).toBeTruthy();

    await page.saveNotes(first.maneuver.id);
    fixture.detectChanges();
    expect(saveButton()).toBeUndefined();
    expect(root.querySelector('.mw__cor')).not.toBeNull();
    expect(page.rows()[0]!.corrected).toBe(true);
  });

  it('habilita el cierre cuando hay firmas y muestra consejo si desaprueba', async () => {
    const fixture = TestBed.createComponent(MissionWorkspacePage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(page.canClose()).toBe(false);
    page.instructorSignature.set({
      signerUserId: 'usr-elena-martin',
      signerName: 'Elena',
      signedAt: '2026-09-06T00:00:00.000Z',
      method: 'type',
      value: 'Elena',
    });
    page.studentSignature.set({
      signerUserId: 'usr-diego-molina',
      signerName: 'Diego',
      signedAt: '2026-09-06T00:00:00.000Z',
      method: 'type',
      value: 'Diego',
    });
    page.form.controls.executedHours.setValue(1.2);
    for (const row of page.rows()) {
      if (!row.grade) page.setGrade(row.maneuver.id, 'B');
    }
    fixture.detectChanges();
    expect(page.canClose()).toBe(true);
    page.setGrade(page.rows()[0]!.maneuver.id, 'P');
    fixture.detectChanges();
    expect(root.textContent).toContain(MISSION_WORKSPACE_COPY.counselQuestion);
  });

  it('muestra 0 en plomo y el desvío DIRBE al calificar', async () => {
    const fixture = TestBed.createComponent(MissionWorkspacePage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;
    const row = page.rows().find((item) => item.expectedStandard) ?? page.rows()[0]!;
    const expected = row.expectedStandard!;
    const expectedIndex = DIRBE_LEVELS.indexOf(expected);
    const rowIndex = page.rows().findIndex((item) => item.maneuver.id === row.maneuver.id);
    const delta = () => root.querySelectorAll('.mw__delta')[rowIndex];

    expect(page.gradeDelta(row)).toBe(0);
    expect(delta()?.classList.contains('mw__delta--flat')).toBe(true);
    expect(delta()?.textContent?.replace(/\s+/g, '')).toContain('0');

    if (expectedIndex > 0) {
      page.setGrade(row.maneuver.id, DIRBE_LEVELS[expectedIndex - 1]!);
      fixture.detectChanges();
      expect(page.gradeDelta(page.rows()[rowIndex]!)).toBe(-1);
      expect(delta()?.classList.contains('mw__delta--down')).toBe(true);
      expect(delta()?.textContent?.replace(/\s+/g, '')).toContain('-1');
    } else {
      page.setGrade(row.maneuver.id, DIRBE_LEVELS[expectedIndex + 1]!);
      fixture.detectChanges();
      expect(page.gradeDelta(page.rows()[rowIndex]!)).toBe(1);
      expect(delta()?.classList.contains('mw__delta--up')).toBe(true);
      expect(delta()?.textContent?.replace(/\s+/g, '')).toContain('+1');
    }
  });
});
