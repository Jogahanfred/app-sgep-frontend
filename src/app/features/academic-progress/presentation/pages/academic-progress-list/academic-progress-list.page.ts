import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ListAcademicProgress, type AcademicProgressRow } from '@core/application';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import { ClientSession } from '../../../../../layout/client-session.service';
import { ACADEMIC_PROGRESS_COPY, ACADEMIC_PROGRESS_ROUTES } from '../../../constants/academic-progress.copy.constants';

@Component({
  selector: 'app-academic-progress-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiInput, UiTable],
  templateUrl: './academic-progress-list.page.html',
  styleUrl: './academic-progress-list.page.scss',
})
export class AcademicProgressListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listProgress = inject(ListAcademicProgress);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);

  readonly copy = ACADEMIC_PROGRESS_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly needsSquadron = signal(false);
  readonly rows = signal<AcademicProgressRow[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);

  readonly columns: UiTableColumn[] = [
    { id: 'student', header: ACADEMIC_PROGRESS_COPY.colStudent },
    { id: 'indicative', header: ACADEMIC_PROGRESS_COPY.colIndicative },
    { id: 'program', header: ACADEMIC_PROGRESS_COPY.colProgram },
    { id: 'progress', header: ACADEMIC_PROGRESS_COPY.colProgress },
    { id: 'average', header: ACADEMIC_PROGRESS_COPY.colAverage },
    { id: 'status', header: ACADEMIC_PROGRESS_COPY.colStatus },
  ];

  readonly filtered = computed(() => {
    const needle = this.query();
    return this.rows().filter((row) => matchesAdminSearch([row.displayName, row.indicative], needle));
  });

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filtered().map((row) => ({
      id: row.userId,
      cells: {
        student: row.displayName,
        indicative: row.indicative || this.copy.none,
        program: row.programName || this.copy.none,
        progress: row.percentComplete === null ? this.copy.none : `${row.percentComplete} %`,
        average: row.average === null ? this.copy.none : row.average.toFixed(1),
        status: row.academicStatus
          ? { text: this.copy.status[row.academicStatus], badge: row.academicStatus === 'completed' ? 'finished' : row.academicStatus === 'suspended' ? 'inactive' : 'approved' }
          : this.copy.none,
      },
    })),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.selectedId.set(null);
    });
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    if (context.roleCode === 'PILOT') {
      void this.router.navigateByUrl(ACADEMIC_PROGRESS_ROUTES.detail(context.userId), { replaceUrl: true });
      return;
    }
    this.listProgress
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.needsSquadron.set(board.needsSquadron);
          this.rows.set(board.rows);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  goDetail(): void {
    const id = this.selectedId();
    if (id) void this.router.navigateByUrl(ACADEMIC_PROGRESS_ROUTES.detail(id));
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
