import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { ActivatedRoute } from '@angular/router';
import { GroundCourseRosterPage } from './ground-course-roster.page';
import { GROUND_GRADING_COPY } from '../../../constants/ground-grading.copy.constants';

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

async function waitReady(fixture: ComponentFixture<GroundCourseRosterPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('GroundCourseRosterPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [GroundCourseRosterPage],
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
                courseId: 'sp-ppl-opv',
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

  it('muestra la matriz de notas y el promedio parcial', async () => {
    const fixture = TestBed.createComponent(GroundCourseRosterPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Operaciones de Vuelo');
    expect(root.textContent).toContain('Iván Rubio Nadal');
    expect(root.textContent).toContain('TB1');
    expect(root.textContent).toContain('EP');
    expect(root.textContent).toContain('EX');
    expect(root.textContent).toContain(GROUND_GRADING_COPY.averageLabel);
    const page = fixture.componentInstance;
    const ivan = page.students().find((item) => item.userId === 'usr-ivan-rubio-nadal');
    expect(ivan).toBeTruthy();
    expect(page.average(ivan!)).not.toBe(GROUND_GRADING_COPY.none);
    expect(root.querySelectorAll('tbody tr').length).toBe(page.students().length);
    expect(root.querySelector('.gr__save-h')).toBeNull();
    expect(root.querySelector('.gr__avg app-button')).toBeNull();
    const inputs = Array.from(root.querySelectorAll('tbody tr:first-child input.gr__mark')) as HTMLInputElement[];
    const ep = inputs[3];
    ep.value = '18';
    ep.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(page.isDirty(ivan!)).toBe(true);
    expect(root.querySelector('.gr__avg app-button')?.textContent).toContain(GROUND_GRADING_COPY.save);
    ep.value = '21';
    ep.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(ep.value).toBe('20');
    ep.value = 'nota';
    ep.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(ep.value).toBe('');
    expect((root.querySelector('tbody tr') as HTMLElement).style.getPropertyValue('--i')).toBe('0');
  });
});
