import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GetOperationalReport,
  type OperationalReport,
  type ReportKind,
  type ReportQuery,
} from '@core/application';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';
import { EMPTY, Subject, switchMap } from 'rxjs';
import { ClientSession } from '../../../../../layout/client-session.service';
import {
  REPORTS_COPY,
  REPORT_KIND_SLUGS,
  reportHref,
  reportKindFromSlug,
} from '../../../constants/reports.copy.constants';
import { downloadReportCsv } from '../../../export/report-csv.export';

const ALL = 'all';

@Component({
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiDatePicker, UiSelect, UiTable],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getReport = inject(GetOperationalReport);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);
  private readonly load$ = new Subject<void>();

  readonly copy = REPORTS_COPY;
  readonly from = new FormControl('', { nonNullable: true });
  readonly to = new FormControl('', { nonNullable: true });
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly report = signal<OperationalReport | null>(null);
  readonly kind = signal<ReportKind>('student-history');
  readonly programId = signal(ALL);
  readonly promotionId = signal(ALL);
  readonly studentId = signal(ALL);
  readonly instructorId = signal(ALL);
  readonly aircraftId = signal(ALL);
  readonly isPilot = computed(() => this.session.roleCode() === 'PILOT');

  readonly kindOptions = computed<ChoiceOption[]>(() =>
    (this.report()?.allowedKinds ?? ['student-history']).map((item) => ({
      value: item,
      label: this.copy.kinds[item],
    })),
  );

  readonly programOptions = computed(() => this.options(this.report()?.programs ?? []));
  readonly promotionOptions = computed(() => this.options(this.report()?.promotions ?? []));
  readonly studentOptions = computed(() => this.options(this.report()?.students ?? []));
  readonly instructorOptions = computed(() => this.options(this.report()?.instructors ?? []));
  readonly aircraftOptions = computed(() => this.options(this.report()?.aircraft ?? []));

  readonly showDates = computed(() => {
    const kind = this.kind();
    return kind !== 'student-ranking' && kind !== 'promotion-ranking' && kind !== 'academic-stats';
  });
  readonly showProgram = computed(() => {
    const kind = this.kind();
    return (
      kind === 'student-history' ||
      kind === 'hours-by-program' ||
      kind === 'hours-by-aircraft' ||
      kind === 'instructor-performance' ||
      kind === 'academic-stats'
    );
  });
  readonly showPromotion = computed(() => {
    const kind = this.kind();
    return (
      kind === 'promotion-history' ||
      kind === 'academic-stats' ||
      kind === 'student-ranking' ||
      kind === 'promotion-ranking'
    );
  });
  readonly showStudent = computed(() => this.kind() === 'student-history' && !this.isPilot());
  readonly showInstructor = computed(() => this.kind() === 'instructor-performance');
  readonly showAircraft = computed(() => this.kind() === 'hours-by-aircraft');

  readonly columns = computed<UiTableColumn[]>(() => this.report()?.columns ?? []);
  readonly rows = computed<UiTableRow[]>(() =>
    (this.report()?.rows ?? []).map((row, index) => ({
      id: String(index),
      cells: row,
    })),
  );
  readonly tableHeading = computed(() => this.copy.kinds[this.kind()]);

  constructor() {
    this.load$
      .pipe(
        switchMap(() => {
          const context = this.session.operationalContext();
          if (!context) {
            this.loadState.set('error');
            return EMPTY;
          }
          this.loadState.set('loading');
          return this.getReport.execute(context, this.query());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.kind.set(report.kind);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.kind.set(reportKindFromSlug(params.get('kind')));
      this.load$.next();
    });
  }

  onKind(value: string): void {
    void this.router.navigateByUrl(reportHref(value as ReportKind));
  }

  consult(): void {
    this.load$.next();
  }

  exportCsv(): void {
    const report = this.report();
    if (!report) return;
    downloadReportCsv(`${REPORT_KIND_SLUGS[report.kind]}.csv`, report.columns, report.rows);
  }

  private options(items: { id: string; label: string }[]): ChoiceOption[] {
    return [{ value: ALL, label: this.copy.all }, ...items.map((item) => ({ value: item.id, label: item.label }))];
  }

  private query(): ReportQuery {
    const optional = (value: string) => (value === ALL ? null : value);
    return {
      kind: this.kind(),
      from: this.showDates() ? this.from.value || null : null,
      to: this.showDates() ? this.to.value || null : null,
      programId: this.showProgram() ? optional(this.programId()) : null,
      promotionId: this.showPromotion() ? optional(this.promotionId()) : null,
      studentId: this.showStudent() ? optional(this.studentId()) : null,
      instructorId: this.showInstructor() ? optional(this.instructorId()) : null,
      aircraftId: this.showAircraft() ? optional(this.aircraftId()) : null,
    };
  }
}
