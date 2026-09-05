import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GetAcademicRecord, type AcademicRecordDetail, type AcademicRecordProgramView } from '@core/application';
import type { AcademicTimelineKind } from '@core/domain/entities';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { UiSteps, type StepItem } from '@shared/components/ui-steps/ui-steps';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import { ClientSession } from '../../../../../layout/client-session.service';
import { ACADEMIC_PROGRESS_COPY, ACADEMIC_PROGRESS_ROUTES } from '../../../constants/academic-progress.copy.constants';

@Component({
  selector: 'app-academic-progress-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, RouterLink, UiSteps, UiTable],
  templateUrl: './academic-progress-detail.page.html',
  styleUrl: './academic-progress-detail.page.scss',
})
export class AcademicProgressDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getRecord = inject(GetAcademicRecord);
  private readonly route = inject(ActivatedRoute);
  readonly session = inject(ClientSession);

  readonly copy = ACADEMIC_PROGRESS_COPY;
  readonly listHref = ACADEMIC_PROGRESS_ROUTES.list;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly detail = signal<AcademicRecordDetail | null>(null);
  readonly selectedProgramId = signal<string | null>(null);

  readonly historyColumns: UiTableColumn[] = [
    { id: 'program', header: ACADEMIC_PROGRESS_COPY.historyProgram },
    { id: 'status', header: ACADEMIC_PROGRESS_COPY.historyStatus },
    { id: 'average', header: ACADEMIC_PROGRESS_COPY.historyAverage },
  ];

  readonly historyRows = computed<UiTableRow[]>(() =>
    (this.detail()?.history ?? []).map((item) => ({
      id: item.program.programId,
      cells: {
        program: item.programName,
        status: {
          text: this.copy.status[item.program.status],
          badge: item.program.status === 'completed' ? 'finished' : item.program.status === 'suspended' ? 'inactive' : 'approved',
        },
        average: item.program.average === null ? this.copy.none : item.program.average.toFixed(1),
      },
    })),
  );

  readonly selectedProgram = computed<AcademicRecordProgramView | null>(() => {
    const id = this.selectedProgramId();
    const history = this.detail()?.history ?? [];
    return history.find((item) => item.program.programId === id) ?? history[0] ?? null;
  });

  readonly currentProgramView = computed<AcademicRecordProgramView | null>(() => {
    const detail = this.detail();
    const progress = detail?.progress;
    if (!detail) return null;
    if (progress) {
      return detail.history.find((item) => item.program.programId === progress.programId) ?? this.selectedProgram();
    }
    return this.selectedProgram();
  });

  readonly timelineSteps = computed<StepItem[]>(() =>
    (this.detail()?.timeline ?? []).map((event) => ({ label: this.timelineLabel(event.kind, event.phaseName) })),
  );

  readonly timelineCurrent = computed(() => {
    const events = this.detail()?.timeline ?? [];
    const index = events.findIndex((event) => event.kind === 'phase-started' || event.kind === 'program-current');
    if (index < 0) return events.length;
    return index + 1;
  });

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId');
    const context = this.operationalContext();
    if (!userId || !context) {
      this.loadState.set('error');
      return;
    }
    this.getRecord
      .execute(context, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.selectedProgramId.set(detail.progress?.programId ?? detail.history[0]?.program.programId ?? null);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  formatDate(value: string | null): string {
    if (!value) return this.copy.none;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  private timelineLabel(kind: AcademicTimelineKind, phaseName: string | null): string {
    if (kind === 'phase-completed' && phaseName) return `${phaseName} ${this.copy.phaseCompletedSuffix}`;
    if (kind === 'phase-started' && phaseName) return `${phaseName} ${this.copy.phaseStartedSuffix}`;
    return this.copy.timeline[kind];
  }

  private operationalContext(): OperationalContext | null {
    const userId = this.session.userId();
    const roleCode = this.session.roleCode();
    if (!userId || !roleCode) return null;
    return {
      userId,
      displayName: this.session.displayName(),
      roleCode,
      assignedUnitId: this.session.assignedUnitId(),
      assignedSquadronId: this.session.assignedSquadronId(),
      unitId: this.session.unitId(),
      squadronId: this.session.squadronId(),
      coversAllSquadrons: this.session.coversAllSquadrons(),
    };
  }
}
