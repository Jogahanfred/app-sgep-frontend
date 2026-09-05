import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  CancelDispatchSlot,
  GetDailyDispatchBoard,
  StartMissionDispatch,
  dispatchPreflight,
  isoCalendarDate,
  type DailyDispatchBoard,
  type DispatchSlot,
} from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { DomainError } from '@core/domain/errors/domain-error';
import { shiftIsoCalendarDate } from '@core/domain/services/mission-dispatch';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ClientSession } from '@layout/client-session.service';
import { DISPATCH_COPY, DISPATCH_ROUTES } from '../../../constants/dispatch.copy.constants';
import type { DispatchBoardTab } from '../../../types/dispatch.types';

@Component({
  selector: 'app-daily-dispatch-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Card, UiConfirmDialog, UiLoading, UiSegmentedControl, UiSelect],
  templateUrl: './daily-dispatch.page.html',
  styleUrl: './daily-dispatch.page.scss',
})
export class DailyDispatchPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly board = inject(GetDailyDispatchBoard);
  private readonly startDispatch = inject(StartMissionDispatch);
  private readonly cancelSlot = inject(CancelDispatchSlot);
  private readonly router = inject(Router);
  private readonly session = inject(ClientSession);
  private readonly toast = inject(ToastService);

  readonly copy = DISPATCH_COPY;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly snapshot = signal<DailyDispatchBoard | null>(null);
  readonly date = signal(isoCalendarDate());
  readonly tab = signal<DispatchBoardTab>('all');
  readonly instructorId = signal('all');
  readonly selectedId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly cancelOpen = signal(false);

  readonly tabOptions = computed<ChoiceOption[]>(() => {
    const totals = this.snapshot()?.totals;
    return [
      { value: 'all', label: `${this.copy.tabAll} (${totals?.scheduled ?? 0})` },
      { value: 'airborne', label: `${this.copy.tabAirborne} (${totals?.airborne ?? 0})` },
      { value: 'pending', label: `${this.copy.tabPending} (${(totals?.ready ?? 0) + this.pendingCount()})` },
      { value: 'closed', label: `${this.copy.tabClosed} (${totals?.closed ?? 0})` },
    ];
  });

  readonly instructorOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: this.copy.instructorAll },
    ...(this.snapshot()?.instructors ?? []).map((item) => ({ value: item.id, label: item.name })),
  ]);

  readonly visibleSlots = computed(() => {
    const instructor = this.instructorId();
    const tab = this.tab();
    return (this.snapshot()?.slots ?? []).filter((slot) => {
      if (instructor !== 'all' && slot.instructorId !== instructor) return false;
      if (tab === 'all') return slot.kind !== 'cancelled';
      if (tab === 'pending') return slot.kind === 'pending' || slot.kind === 'ready';
      return slot.kind === tab;
    });
  });

  readonly selected = computed((): DispatchSlot | null => {
    const id = this.selectedId();
    const slots = this.visibleSlots();
    return slots.find((item) => item.assignmentId === id) ?? slots[0] ?? null;
  });

  readonly checks = computed(() => dispatchPreflight(this.selected()));
  readonly checksReady = computed(() => this.checks().length > 0 && this.checks().every((item) => item.ready));
  readonly selectedAssignmentId = computed(() => this.selected()?.assignmentId ?? null);

  constructor() {
    this.reload();
  }

  dateLabel(): string {
    const iso = this.date();
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    const body = `${day} ${this.copy.months[month - 1]} ${year}`;
    return iso === isoCalendarDate() ? `${this.copy.todayPrefix}, ${body}` : body;
  }

  kindLabel(kind: DispatchSlot['kind']): string {
    if (kind === 'ready') return this.copy.kindReady;
    if (kind === 'airborne') return this.copy.kindAirborne;
    if (kind === 'closed') return this.copy.kindClosed;
    if (kind === 'cancelled') return this.copy.kindCancelled;
    return this.copy.kindPending;
  }

  shiftDay(days: number): void {
    this.date.set(shiftIsoCalendarDate(this.date(), days));
    this.reload();
  }

  setTab(value: string): void {
    this.tab.set(value as DispatchBoardTab);
  }

  setInstructor(value: string): void {
    this.instructorId.set(value);
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  async dispatch(slot: DispatchSlot): Promise<void> {
    const context = this.operationalContext();
    if (!context || !slot.executionId || !this.snapshot()?.canDispatch) return;
    this.busy.set(true);
    this.startDispatch
      .execute(context, slot.executionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(this.copy.toastDispatched, this.copy.toastDispatchedBody);
          this.reload();
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.toast.error(err instanceof DomainError ? err.message : this.copy.loadError);
        },
      });
  }

  openLive(slot: DispatchSlot): void {
    if (!slot.executionId) {
      this.toast.info(this.copy.noExecution);
      return;
    }
    void this.router.navigateByUrl(DISPATCH_ROUTES.workspace(slot.executionId));
  }

  openRecord(slot: DispatchSlot): void {
    if (slot.studentId) void this.router.navigateByUrl(DISPATCH_ROUTES.record(slot.studentId));
  }

  reschedule(slot: DispatchSlot): void {
    void this.router.navigateByUrl(DISPATCH_ROUTES.trainingEdit(slot.assignmentId));
  }

  askCancel(): void {
    if (!this.selected() || !this.snapshot()?.canDispatch) return;
    this.cancelOpen.set(true);
  }

  closeCancel(): void {
    this.cancelOpen.set(false);
  }

  confirmCancel(): void {
    const context = this.operationalContext();
    const slot = this.selected();
    if (!context || !slot) return;
    this.cancelOpen.set(false);
    this.busy.set(true);
    this.cancelSlot
      .execute(context, slot.assignmentId, 'Cancelado desde el despacho diario.')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(this.copy.toastCancelled, this.copy.toastCancelledBody);
          this.reload();
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.toast.error(err instanceof DomainError ? err.message : this.copy.loadError);
        },
      });
  }

  exportSoon(): void {
    this.toast.info(this.copy.exportSoon);
  }

  private pendingCount(): number {
    return (this.snapshot()?.slots ?? []).filter((item) => item.kind === 'pending').length;
  }

  private reload(): void {
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.loadState.set('loading');
    this.board
      .execute(context, this.date())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.snapshot.set(snapshot);
          const current = this.selectedId();
          const next =
            snapshot.slots.find((item) => item.assignmentId === current)?.assignmentId ??
            snapshot.slots.find((item) => item.kind === 'ready')?.assignmentId ??
            snapshot.slots[0]?.assignmentId ??
            null;
          this.selectedId.set(next);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  private operationalContext(): OperationalContext | null {
    return this.session.operationalContext();
  }
}
