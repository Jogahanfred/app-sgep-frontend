import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Icon } from '@shared/components/icon/icon';
import { Modal } from '@shared/components/modal/modal';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiProgress } from '@shared/components/ui-progress/ui-progress';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { isMissionExecutionBoardUrl } from '@layout/navigation/data/nav-routes.constants';
import { DocumentScrollLock } from '@shared/utils/document-scroll-lock';
import { MISSION_EXECUTION_COPY, MISSION_EXECUTION_ROUTES } from './constants/mission-execution.copy.constants';
import { MISSION_EXECUTION_TODAY_ISO, missionExecutionBoardForDate } from './data/mission-execution-board.data';
import {
  FIDS_AIRCRAFT_CELLS,
  FIDS_BOARDING_CELLS,
  FIDS_BOARD_SLOT_COUNT,
  FIDS_CREW_CELLS,
  FIDS_SLOT_COUNT,
  FIDS_STATUS_CELLS,
  FIDS_TIME_CELLS,
  MISSION_EXECUTION_FILTERS,
  fidsOffsetTime,
  fidsPad,
  fidsPadSlots,
  fidsRemark,
  missionExecutionCrewStrip,
  type MissionExecutionBoardFilter,
  type MissionExecutionBoardItem,
} from './types/mission-execution-board.types';

@Component({
  selector: 'app-mission-execution-inbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    Alert,
    Button,
    Card,
    Icon,
    Modal,
    UiAvatar,
    UiDatePicker,
    UiInput,
    UiProgress,
    UiSegmentedControl,
    UiSelect,
  ],
  templateUrl: './mission-execution-inbox.page.html',
  styleUrl: './mission-execution-inbox.page.scss',
})
export class MissionExecutionInboxPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly scrollLock = inject(DocumentScrollLock);
  private fidsScrollLocked = false;

  readonly copy = MISSION_EXECUTION_COPY;
  readonly todayIso = MISSION_EXECUTION_TODAY_ISO;
  readonly boardDate = new FormControl(MISSION_EXECUTION_TODAY_ISO, { nonNullable: true });
  readonly operationDateIso = signal(MISSION_EXECUTION_TODAY_ISO);
  readonly board = computed(() => missionExecutionBoardForDate(this.operationDateIso()));
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly filter = signal<MissionExecutionBoardFilter>('all');
  readonly isPastDate = computed(() => this.operationDateIso() < this.todayIso);
  readonly orderOpen = signal(false);
  readonly orderItem = signal<MissionExecutionBoardItem | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(4);
  readonly pageSizeOptions: readonly number[] = [4, 10, 20];
  readonly fidsTimeCells = FIDS_TIME_CELLS;
  readonly fidsCrewCells = FIDS_CREW_CELLS;
  readonly fidsAircraftCells = FIDS_AIRCRAFT_CELLS;
  readonly fidsBoardingCells = FIDS_BOARDING_CELLS;
  readonly fidsStatusCells = FIDS_STATUS_CELLS;
  readonly fidsExpanded = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.isFidsBoardRoute()),
      startWith(this.isFidsBoardRoute()),
    ),
    { initialValue: this.isFidsBoardRoute() },
  );
  readonly fidsNonce = signal(0);

  readonly filterOptions = computed<ChoiceOption[]>(() =>
    MISSION_EXECUTION_FILTERS.map((value) => ({
      value,
      label: this.copy.filter[value],
      disabled: value === 'in-progress' && this.isPastDate(),
    })),
  );

  readonly visible = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.filter();
    return this.board().missions.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!query) return true;
      return `${item.student} ${item.mission} ${item.program} ${item.code} ${item.aircraft} ${item.studentCallsign}`.toLowerCase().includes(query);
    });
  });

  readonly total = computed(() => this.visible().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize()) || 1));
  readonly pagedVisible = computed(() => {
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return this.visible().slice(start, start + size);
  });
  readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  readonly rangeLabel = computed(() => {
    if (this.total() === 0) return '0 resultados';
    return `Mostrando ${this.rangeStart()} - ${this.rangeEnd()} de ${this.total()}`;
  });
  readonly pageItems = computed(() => this.buildPageItems(this.page(), this.totalPages()));
  readonly canPrev = computed(() => this.page() > 1);
  readonly canNext = computed(() => this.page() < this.totalPages());
  readonly showPager = computed(() => this.total() > 0);
  readonly pageSizeChoices = computed(() =>
    this.pageSizeOptions.map((size) => ({ value: String(size), label: String(size) })),
  );

  readonly kpis = computed(() => {
    const missions = this.board().missions;
    return {
      scheduled: missions.filter((item) => item.status === 'scheduled').length,
      inProgress: missions.filter((item) => item.status === 'in-progress').length,
      completed: missions.filter((item) => item.status === 'completed').length,
      cancelled: missions.filter((item) => item.status === 'cancelled').length,
    };
  });

  readonly upcoming = computed(() => {
    const missions = this.board().missions;
    const live = this.isPastDate()
      ? missions.filter((item) => item.status !== 'cancelled')
      : missions.filter((item) => item.status === 'scheduled' || item.status === 'in-progress');
    return live.slice().sort((a, b) => a.time.localeCompare(b.time));
  });

  readonly nextId = computed(
    () => this.upcoming().find((item) => item.status === 'scheduled')?.id ?? this.upcoming()[0]?.id ?? null,
  );

  readonly upcomingLeft = computed(() => fidsPadSlots(this.upcoming().slice(0, FIDS_SLOT_COUNT), FIDS_SLOT_COUNT));

  readonly upcomingRight = computed(() =>
    fidsPadSlots(this.upcoming().slice(FIDS_SLOT_COUNT, FIDS_SLOT_COUNT * 2), FIDS_SLOT_COUNT),
  );

  readonly upcomingBoard = computed(() =>
    fidsPadSlots(this.upcoming().slice(0, FIDS_BOARD_SLOT_COUNT), FIDS_BOARD_SLOT_COUNT),
  );

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.page.set(1);
    });
    this.boardDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.applyBoardDate(value);
    });
    effect(() => {
      const pages = Math.max(1, Math.ceil(this.visible().length / this.pageSize()) || 1);
      untracked(() => {
        if (this.page() > pages) this.page.set(pages);
      });
    });
    effect(() => {
      if (this.fidsExpanded()) this.holdFidsScroll();
      else this.releaseFidsScroll();
    });
    this.destroyRef.onDestroy(() => this.releaseFidsScroll());
  }

  crewStrip(item: MissionExecutionBoardItem): string {
    return missionExecutionCrewStrip(item);
  }

  fidsChars(value: string, size: number): string[] {
    return fidsPad(value, size);
  }

  fidsFlipIndex(column: 'time' | 'crew' | 'ac' | 'gate' | 'status', index: number): number {
    const origin =
      column === 'time'
        ? 0
        : column === 'crew'
          ? this.fidsTimeCells
          : column === 'ac'
            ? this.fidsTimeCells + this.fidsCrewCells
            : column === 'gate'
              ? this.fidsTimeCells + this.fidsCrewCells + this.fidsAircraftCells
              : this.fidsTimeCells + this.fidsCrewCells + this.fidsAircraftCells + this.fidsBoardingCells;
    return origin + index;
  }

  boardingTime(item: MissionExecutionBoardItem): string {
    return fidsOffsetTime(item.time, -60);
  }

  remarkKind(item: MissionExecutionBoardItem): 'boarding' | 'closing' {
    return item.status === 'completed' ? 'closing' : fidsRemark(item.status);
  }

  remarkLabel(item: MissionExecutionBoardItem): string {
    const label = this.remarkKind(item) === 'closing' ? this.copy.fidsClosing : this.copy.fidsBoarding;
    return label.slice(0, 10);
  }

  crewMark(callsign: string, role: 'IP' | 'AP'): string {
    return `${callsign} (${role})`.toUpperCase();
  }

  slotRange(item: MissionExecutionBoardItem): string {
    return `${item.order.departure} – ${item.order.arrival}`;
  }

  canGrade(item: MissionExecutionBoardItem): boolean {
    if (this.isPastDate()) return false;
    return item.status === 'scheduled' || item.status === 'in-progress';
  }

  canViewDetail(item: MissionExecutionBoardItem): boolean {
    return item.status === 'completed';
  }

  setFilter(value: string): void {
    if (value === 'in-progress' && this.isPastDate()) return;
    this.filter.set(value as MissionExecutionBoardFilter);
    this.page.set(1);
  }

  setPageSize(size: number): void {
    if (!this.pageSizeOptions.includes(size)) return;
    this.pageSize.set(size);
    this.page.set(1);
  }

  onPageSize(value: string): void {
    this.setPageSize(Number(value));
  }

  goToPage(page: number): void {
    this.page.set(Math.min(this.totalPages(), Math.max(1, page)));
  }

  first(): void {
    this.goToPage(1);
  }

  prev(): void {
    this.goToPage(this.page() - 1);
  }

  next(): void {
    this.goToPage(this.page() + 1);
  }

  last(): void {
    this.goToPage(this.totalPages());
  }

  openDetail(item: MissionExecutionBoardItem): void {
    if (!this.canViewDetail(item)) return;
    void this.router.navigateByUrl(MISSION_EXECUTION_ROUTES.workspace(item.executionId));
  }

  openGrade(item: MissionExecutionBoardItem): void {
    if (!this.canGrade(item)) return;
    void this.router.navigateByUrl(MISSION_EXECUTION_ROUTES.workspace(item.executionId));
  }

  openOrder(item: MissionExecutionBoardItem): void {
    this.orderItem.set(item);
    this.orderOpen.set(true);
  }

  closeOrder(): void {
    this.orderOpen.set(false);
    this.orderItem.set(null);
  }

  expandFids(): void {
    void this.router.navigateByUrl(MISSION_EXECUTION_ROUTES.board);
  }

  collapseFids(): void {
    void this.router.navigateByUrl(MISSION_EXECUTION_ROUTES.inbox);
  }

  reloadFids(): void {
    this.fidsNonce.update((value) => value + 1);
  }

  private holdFidsScroll(): void {
    if (this.fidsScrollLocked) return;
    this.scrollLock.lock();
    this.fidsScrollLocked = true;
  }

  private releaseFidsScroll(): void {
    if (!this.fidsScrollLocked) return;
    this.scrollLock.unlock();
    this.fidsScrollLocked = false;
  }

  @HostListener('document:keydown.escape')
  onFidsEscape(): void {
    if (this.fidsExpanded()) this.collapseFids();
  }

  private isFidsBoardRoute(): boolean {
    return isMissionExecutionBoardUrl(this.router.url);
  }

  private applyBoardDate(raw: string): void {
    const iso = !raw || raw > this.todayIso ? this.todayIso : raw;
    if (iso !== raw) {
      this.boardDate.setValue(iso, { emitEvent: false });
    }
    if (iso === this.operationDateIso()) return;
    this.operationDateIso.set(iso);
    this.page.set(1);
    this.fidsNonce.update((value) => value + 1);
    if (iso < this.todayIso && this.filter() === 'in-progress') {
      this.filter.set('all');
    }
  }

  private buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const items: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) items.push('ellipsis');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < total - 1) items.push('ellipsis');
    items.push(total);
    return items;
  }
}
