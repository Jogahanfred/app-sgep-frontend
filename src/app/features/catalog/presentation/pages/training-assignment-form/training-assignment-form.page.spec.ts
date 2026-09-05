import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { TRAINING_ASSIGNMENT_FORM_COPY } from '../../../constants/training-assignment-form.copy.constants';
import { TrainingAssignmentFormPage } from './training-assignment-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

function route(assignmentType: 'group' | 'individual') {
  return {
    snapshot: {
      data: { assignmentType },
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
    },
  };
}

async function waitCatalog(fixture: ComponentFixture<TrainingAssignmentFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.programs().length === 0 && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('TrainingAssignmentFormPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('en matrícula de promoción muestra participantes al elegir la promoción', async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingAssignmentFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: route('group') },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingAssignmentFormPage);
    await waitCatalog(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(TRAINING_ASSIGNMENT_FORM_COPY.groupCreateTitle);
    expect(fixture.componentInstance.listHref).toContain('lista=promocion');
    expect(text).not.toContain('2.1');
    fixture.componentInstance.form.controls.programId.setValue('prg-heli-2023');
    fixture.componentInstance.nextStep();
    fixture.componentInstance.changePromotion('promotion-2025-alfa');
    const started = Date.now();
    while (fixture.componentInstance.promotionMembers().length === 0 && Date.now() - started < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
    }
    fixture.detectChanges();
    const stepTwo = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(stepTwo).toContain(TRAINING_ASSIGNMENT_FORM_COPY.participantsHeading);
    expect(stepTwo).toContain('Sofía Vidal Romero');
    expect(stepTwo).not.toContain('77812045B');
    expect(stepTwo).not.toContain('sofia.vidal@alumno.siga.demo');
    expect((fixture.nativeElement as HTMLElement).querySelector('.member-grid')).not.toBeNull();
  });

  it('en matrícula de alumno usa el ancho completo del formulario', async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingAssignmentFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: route('individual') },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TrainingAssignmentFormPage);
    await waitCatalog(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(TRAINING_ASSIGNMENT_FORM_COPY.individualCreateTitle);
    expect(fixture.componentInstance.listHref).toContain('lista=alumno');
    expect(root.querySelector('.training-form--solo')).not.toBeNull();
    expect(root.textContent).not.toContain(TRAINING_ASSIGNMENT_FORM_COPY.caseLabel);
    expect(root.textContent).not.toContain(TRAINING_ASSIGNMENT_FORM_COPY.missionLabel);
    expect(root.textContent).not.toContain(TRAINING_ASSIGNMENT_FORM_COPY.instructorLabel);
    const labels = fixture.componentInstance.studentOptions().map((item) => item.label);
    expect(labels).toContain('Natalia Rey Cubero');
    expect(labels).toContain('Silvia Rueda Paz');
    expect(labels).not.toContain('Sofía Vidal Romero');
  });
});
