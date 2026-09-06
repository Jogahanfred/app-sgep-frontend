import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { MockAdminCatalogRepository } from '../../../../../core/adapters/mock/mock-admin-catalog.repository';
import { GetAirGradeBoard } from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { ClientSession } from '@layout/client-session.service';
import { AIR_GRADE_COPY } from '../../../constants/air-grades.copy.constants';
import { AirGradeSheetPage } from './air-grade-sheet.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AirGradeSheetPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

const sofiaPilot: OperationalContext = {
  userId: 'usr-sofia-vidal',
  displayName: 'Sofía Vidal Romero',
  roleCode: 'PILOT',
  assignedUnitId: 'unit-norte',
  assignedSquadronId: 'sq-alfa',
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('AirGradeSheetPage', () => {
  it('muestra la cartilla y habilita la firma del alumno', async () => {
    const board = await firstValueFrom(
      new GetAirGradeBoard(new MockAdminCatalogRepository()).execute(sofiaPilot, 'usr-sofia-vidal'),
    );
    const tile = board.programs
      .flatMap((program) => program.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)))
      .find((item) => item.clickable);
    expect(tile?.executionId).toBeTruthy();

    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AirGradeSheetPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                userId: 'usr-sofia-vidal',
                executionId: tile!.executionId!,
              }),
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(AirGradeSheetPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(page.loadState()).toBe('ready');
    expect(page.sheet()?.canSignStudent).toBe(true);
    expect(page.sheet()?.pendingStudentSignature).toBe(true);
    expect(page.sheet()?.instructorSignature).toBeTruthy();
    expect(root.querySelector('.ap__head h1')?.textContent).toContain(AIR_GRADE_COPY.sheetTitle);
    expect(root.querySelector('app-accordion')).not.toBeNull();
    expect(root.textContent).toContain(AIR_GRADE_COPY.corLabel);
    expect(root.textContent).toContain(AIR_GRADE_COPY.signStudent);
    expect(root.textContent).toContain(AIR_GRADE_COPY.objection);
    expect(root.textContent).toContain(AIR_GRADE_COPY.signed);
    expect(root.querySelector('.ags__hist--current')).not.toBeNull();
    expect(root.querySelector('.ags__grades button')?.hasAttribute('disabled')).toBe(true);
    expect(root.querySelector('.ags__delta')).not.toBeNull();
    expect(root.querySelector('.ags__note--cause')).not.toBeNull();
    expect(root.querySelector('.ags__note--obs')).not.toBeNull();
    expect(root.querySelector('.ags__note--rec')).not.toBeNull();
    expect(root.querySelector('.ags__note--cause span')?.textContent).toContain(AIR_GRADE_COPY.causeLabel);
    expect(root.querySelector('.ags__note--obs span')?.textContent).toContain(AIR_GRADE_COPY.observationLabel);
    expect(root.querySelector('.ags__note--rec span')?.textContent).toContain(AIR_GRADE_COPY.instructionLabel);
    expect(root.querySelector('.ags__autograph')?.textContent?.trim()).toBeTruthy();
    expect(root.querySelector('#ags-firma .ags__autograph')).not.toBeNull();
    expect(getComputedStyle(root.querySelector('.ags__autograph')!).fontFamily).toMatch(/Segoe Script|cursive/i);
    expect(root.querySelector('.ags__pads')).toBeNull();
    expect(root.querySelector('#ags-firma .ags__sign-actions')).not.toBeNull();
    expect(root.textContent).toContain(AIR_GRADE_COPY.signPad);
    const comments = root.querySelector('blockquote');
    const signs = root.querySelector('#ags-firma');
    expect(comments && signs && (comments.compareDocumentPosition(signs) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  });
});
