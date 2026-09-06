import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  GetFlightIncidentBoard,
  isIncidentInDateRange,
  matchesIncidentBucket,
  type FlightIncidentBoard,
  type FlightIncidentBoardBucket,
  type FlightIncidentLifecycle,
} from '@core/application';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableBadgeTone, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import type { ChoiceOption } from '@shared/models/choice.model';
import { FLIGHT_INCIDENT_COPY, FLIGHT_INCIDENT_ROUTES } from '../../../constants/flight-incident.copy.constants';

const LIFECYCLE_BADGE: Record<FlightIncidentLifecycle, UiTableBadgeTone> = {
  draft: 'inactive',
  registered: 'active',
  deferred: 'registered',
  resolved: 'approved',
};

@Component({
  selector: 'app-flight-incident-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiDatePicker, UiLoading, UiSegmentedControl, UiSelect, UiTable],
  templateUrl: './flight-incident-board.page.html',
  styleUrl: './flight-incident-board.page.scss',
})
export class FlightIncidentBoardPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly getBoard = inject(GetFlightIncidentBoard);

  readonly copy = FLIGHT_INCIDENT_COPY;
  readonly reportHref = FLIGHT_INCIDENT_ROUTES.register;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly board = signal<FlightIncidentBoard | null>(null);
  readonly aircraftFilter = signal('all');
  readonly bucket = signal<FlightIncidentBoardBucket>('all');
  readonly from = new FormControl('', { nonNullable: true });
  readonly to = new FormControl('', { nonNullable: true });
  readonly fromValue = signal('');
  readonly toValue = signal('');
  readonly selectedId = signal<string | null>(null);

  readonly columns: UiTableColumn[] = [
    { id: 'folio', header: FLIGHT_INCIDENT_COPY.boardFolio, align: 'left' },
    { id: 'aircraft', header: FLIGHT_INCIDENT_COPY.boardAircraft },
    { id: 'date', header: FLIGHT_INCIDENT_COPY.boardDate },
    { id: 'summary', header: FLIGHT_INCIDENT_COPY.boardSummary },
    { id: 'action', header: FLIGHT_INCIDENT_COPY.boardAction },
    { id: 'status', header: FLIGHT_INCIDENT_COPY.boardState },
  ];

  constructor() {
    this.from.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.fromValue.set(value);
      this.selectedId.set(null);
    });
    this.to.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.toValue.set(value);
      this.selectedId.set(null);
    });
    this.reload();
  }

  readonly aircraftOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: 'Todas las matrículas' },
    ...(this.board()?.aircraftOptions ?? []),
  ]);

  readonly scopedRows = computed(() => {
    const aircraftId = this.aircraftFilter();
    const from = this.fromValue();
    const to = this.toValue();
    return (this.board()?.rows ?? []).filter((row) => {
      if (aircraftId !== 'all' && row.aircraftId !== aircraftId) return false;
      return isIncidentInDateRange(row.detectedAt, from, to);
    });
  });

  readonly filteredRows = computed(() => {
    const bucket = this.bucket();
    return this.scopedRows().filter((row) => matchesIncidentBucket(row.severity, bucket));
  });

  readonly statusOptions = computed<ChoiceOption[]>(() => {
    const scoped = this.scopedRows();
    const critical = scoped.filter((row) => matchesIncidentBucket(row.severity, 'critical')).length;
    const mel = scoped.filter((row) => matchesIncidentBucket(row.severity, 'mel')).length;
    const closed = scoped.filter((row) => matchesIncidentBucket(row.severity, 'closed')).length;
    return [
      { value: 'all', label: `Todas (${scoped.length})` },
      { value: 'critical', label: `Críticas AOG (${critical})` },
      { value: 'mel', label: `Diferidas MEL (${mel})` },
      { value: 'closed', label: `Subsanadas (${closed})` },
    ];
  });

  readonly tableRows = computed<UiTableRow[]>(() =>
    this.filteredRows().map((row) => ({
      id: row.id,
      cells: {
        folio: row.folio,
        aircraft: row.aircraftRegistration,
        date: row.detectedAt,
        summary: row.summary || this.copy.none,
        action: row.crewAction || this.copy.none,
        status: {
          text: this.copy.boardLifecycles[row.lifecycle],
          badge: LIFECYCLE_BADGE[row.lifecycle],
        },
      },
    })),
  );

  onAircraft(value: string): void {
    this.aircraftFilter.set(value || 'all');
    this.selectedId.set(null);
  }

  onBucket(value: string): void {
    this.bucket.set((value as FlightIncidentBoardBucket) || 'all');
    this.selectedId.set(null);
  }

  reload(): void {
    this.loadState.set('loading');
    this.getBoard
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.board.set(board);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  readonly canTakeAction = computed(() => {
    const row = this.filteredRows().find((item) => item.id === this.selectedId());
    return !!row && row.lifecycle !== 'resolved';
  });

  openIncident(): void {
    const id = this.selectedId();
    if (id) void this.router.navigateByUrl(FLIGHT_INCIDENT_ROUTES.detail(id));
  }

  openAction(): void {
    const id = this.selectedId();
    if (id) void this.router.navigateByUrl(FLIGHT_INCIDENT_ROUTES.action(id, true));
  }

  takeAction(): void {
    const id = this.selectedId();
    if (!id || !this.canTakeAction()) return;
    void this.router.navigateByUrl(FLIGHT_INCIDENT_ROUTES.action(id));
  }
}
