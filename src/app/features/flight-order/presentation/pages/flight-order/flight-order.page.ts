import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  AssignGroundCourses,
  GetFlightOrderBoard,
  IssueFlightOrder,
  isoCalendarDate,
  type FlightOrderBoard,
  type FlightOrderMissionNode,
  type FlightOrderTrainee,
} from '@core/application';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { DomainError } from '@core/domain/errors/domain-error';
import { matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Modal } from '@shared/components/modal/modal';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiCurriculumTree } from '@shared/components/ui-curriculum-tree/ui-curriculum-tree';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiProgress } from '@shared/components/ui-progress/ui-progress';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ClientSession } from '@layout/client-session.service';
import {
  FLIGHT_ORDER_COPY,
  FLIGHT_ORDER_DATE_MAX_YEAR,
  FLIGHT_ORDER_DEFAULT_TIME,
} from '../../../constants/flight-order.copy.constants';
import {
  FLIGHT_ORDER_FILTER_ALL,
  FLIGHT_ORDER_SCHEDULABLE,
  FLIGHT_ORDER_SHIFT_TIMES,
  FLIGHT_ORDER_SHIFTS,
  FLIGHT_ORDER_TREE_MODULES,
  flightOrderShiftFromTime,
  type FlightOrderRosterMode,
  type FlightOrderShift,
  type FlightOrderTreeModule,
} from '../../../types/flight-order.types';
import {
  curriculumByModule,
  flattenCurriculumMissions,
  plannerLegend,
  toPlannerPhases,
  expandFlightOrderTree,
} from '../../../mappers/flight-order-planner.mapper';

@Component({
  selector: 'app-flight-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    Modal,
    UiAvatar,
    UiCurriculumTree,
    UiDatePicker,
    UiInput,
    UiLoading,
    UiProgress,
    UiSegmentedControl,
    UiSelect,
    UiTextarea,
  ],
  templateUrl: './flight-order.page.html',
  styleUrl: './flight-order.page.scss',
})
export class FlightOrderPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly board = inject(GetFlightOrderBoard);
  private readonly issue = inject(IssueFlightOrder);
  private readonly assignGround = inject(AssignGroundCourses);
  private readonly session = inject(ClientSession);
  private readonly toast = inject(ToastService);

  readonly copy = FLIGHT_ORDER_COPY;
  readonly dateMaxYear = FLIGHT_ORDER_DATE_MAX_YEAR;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly snapshot = signal<FlightOrderBoard | null>(null);
  readonly rosterMode = signal<FlightOrderRosterMode>('promotion');
  readonly promotionId = signal('');
  readonly programFilter = signal(FLIGHT_ORDER_FILTER_ALL);
  readonly treeModule = signal<FlightOrderTreeModule>('air');
  readonly selectedId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly previewOpen = signal(false);
  readonly orderReadOnly = signal(false);
  readonly shift = signal<FlightOrderShift>('morning');
  readonly selectedMissionId = signal<string | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly dateField = new FormControl(isoCalendarDate(), { nonNullable: true });
  readonly timeField = new FormControl(FLIGHT_ORDER_DEFAULT_TIME, { nonNullable: true });
  readonly remarksField = new FormControl('', { nonNullable: true });
  readonly durationField = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  readonly missionId = signal('');
  readonly instructorId = signal('');
  readonly aircraftId = signal('');

  readonly rosterOptions = computed<ChoiceOption[]>(() => [
    { value: 'individual', label: this.copy.rosterIndividual },
    { value: 'promotion', label: this.copy.rosterPromo },
  ]);

  readonly promotionOptions = computed<ChoiceOption[]>(() => {
    const programId = this.programFilter();
    const trainees = this.snapshot()?.trainees ?? [];
    return (this.snapshot()?.cohorts ?? [])
      .filter((item) =>
        trainees.some(
          (trainee) =>
            trainee.source === 'promotion' &&
            trainee.promotionId === item.promotionId &&
            (programId === FLIGHT_ORDER_FILTER_ALL || trainee.programId === programId),
        ),
      )
      .map((item) => ({
        value: item.promotionId,
        label: `${item.code} · ${item.name}`,
        hint: `${item.enrolledCount} ${this.copy.enrolledCount}`,
      }));
  });

  readonly programOptions = computed<ChoiceOption[]>(() => {
    const trainee = this.selected();
    const snapshot = this.snapshot();
    if (!trainee || !snapshot) return [];
    const seen = new Set<string>();
    const options: ChoiceOption[] = [];
    for (const item of snapshot.trainees) {
      if (item.userId !== trainee.userId || seen.has(item.programId)) continue;
      seen.add(item.programId);
      options.push({ value: item.programId, label: item.programName, hint: item.programCode });
    }
    return options;
  });

  readonly rosterTrainees = computed(() => {
    const mode = this.rosterMode();
    const promotionId = this.promotionId();
    const programId = this.programFilter();
    const query = this.query();
    return (this.snapshot()?.trainees ?? []).filter((item) => {
      if (item.source !== mode) return false;
      if (mode === 'promotion') {
        if (!promotionId || item.promotionId !== promotionId) return false;
      }
      if (programId !== FLIGHT_ORDER_FILTER_ALL && item.programId !== programId) return false;
      return matchesAdminSearch(
        [
          item.displayName,
          item.indicative,
          item.programName,
          item.programCode,
          item.promotionName,
          item.nextMissionLabel,
          item.lastCompletedLabel,
        ],
        query,
      );
    });
  });

  readonly visibleTrainees = computed(() => this.rosterTrainees());

  readonly emptyTitle = computed(() => {
    if (this.rosterMode() === 'promotion' && !this.promotionId()) return this.copy.emptyCohort;
    if (this.query().trim()) return this.copy.emptySearch;
    return this.rosterMode() === 'promotion' ? this.copy.emptyPromo : this.copy.emptyIndividual;
  });

  readonly selected = computed((): FlightOrderTrainee | null => {
    const id = this.selectedId();
    const list = this.visibleTrainees();
    return list.find((item) => item.id === id) ?? list[0] ?? null;
  });

  readonly selectedMission = computed((): FlightOrderMissionNode | null => {
    const trainee = this.selected();
    const curriculum = this.moduleCurriculum();
    if (!trainee || !curriculum) return null;
    const missions = flattenCurriculumMissions(expandFlightOrderTree(curriculum));
    const id = this.selectedMissionId();
    return missions.find((item) => item.id === id) ?? missions.find((item) => item.id === trainee.nextMissionId) ?? missions[0] ?? null;
  });

  readonly moduleCurriculum = computed(() => {
    const trainee = this.selected();
    if (!trainee) return null;
    return curriculumByModule(trainee.curriculum, this.treeModule());
  });

  readonly treeModuleOptions = computed<ChoiceOption[]>(() =>
    FLIGHT_ORDER_TREE_MODULES.map((value) => ({
      value,
      label: this.copy.treeModule[value],
    })),
  );

  readonly treePhases = computed(() => {
    const curriculum = this.moduleCurriculum();
    if (!curriculum) return [];
    return toPlannerPhases(
      curriculum,
      !!this.snapshot()?.canIssue && !this.selected()?.programCulminated,
      this.canLoadGround(),
    );
  });

  readonly canLoadGround = computed(() => !!this.snapshot()?.canIssue && !!this.selected()?.canAssignGround);

  readonly legend = plannerLegend();

  readonly kpiCompletedLabel = computed(() =>
    this.treeModule() === 'ground' ? this.copy.kpiCoursesCompleted : this.copy.kpiCompleted,
  );

  readonly treeEmptyLabel = computed(() =>
    this.treeModule() === 'ground' ? this.copy.emptyEvaluations : this.copy.emptyMissions,
  );

  readonly shiftOptions = computed<ChoiceOption[]>(() =>
    FLIGHT_ORDER_SHIFTS.map((value) => ({
      value,
      label: this.copy.shift[value],
    })),
  );

  readonly previewTitle = computed(() => (this.orderReadOnly() ? this.copy.viewTitle : this.copy.emitTitle));

  readonly orderNotice = computed(() => {
    if (this.orderReadOnly()) return this.copy.readonlyNotice;
    return this.selectedMission()?.status === 'scheduled' ? this.copy.scheduledNotice : this.copy.notice;
  });

  readonly moduleStats = computed(() => {
    const trainee = this.selected();
    const curriculum = this.moduleCurriculum();
    const itemWord = this.treeModule() === 'ground' ? this.copy.coursesWord : this.copy.missionsWord;
    if (!trainee || !curriculum) {
      return { completed: 0, total: 0, hours: 0, average: null as number | null, itemWord };
    }
    const tree = expandFlightOrderTree(curriculum);
    if (this.treeModule() === 'ground') {
      const courses = tree.phases.filter((phase) => phase.loaded !== false);
      const completedCourses = courses.filter((phase) => phase.percent === 100);
      const grades = flattenCurriculumMissions(tree)
        .map((item) => item.average)
        .filter((item): item is number => item !== null);
      return {
        completed: completedCourses.length,
        total: courses.length,
        hours: completedCourses.reduce((sum, phase) => sum + phase.hours, 0),
        average: meanScore(grades),
        itemWord,
      };
    }
    const missions = flattenCurriculumMissions(tree);
    const completed = missions.filter((item) => item.status === 'completed');
    const grades = completed.map((item) => item.average).filter((item): item is number => item !== null);
    return {
      completed: completed.length,
      total: missions.length,
      hours: completed.reduce((sum, item) => sum + item.hours, 0),
      average: meanScore(grades),
      itemWord,
    };
  });

  readonly canScheduleSelected = computed(() => {
    const trainee = this.selected();
    const status = this.selectedMission()?.status;
    if (!trainee || trainee.programCulminated || !this.snapshot()?.canIssue) return false;
    return !!status && (FLIGHT_ORDER_SCHEDULABLE as readonly string[]).includes(status);
  });

  readonly instructorOptions = computed<ChoiceOption[]>(() =>
    (this.snapshot()?.instructors ?? []).map((item) => ({ value: item.id, label: item.name, hint: item.hint })),
  );

  readonly aircraftOptions = computed<ChoiceOption[]>(() =>
    (this.snapshot()?.aircraft ?? []).map((item) => ({ value: item.id, label: item.name, hint: item.hint })),
  );

  readonly canSubmit = computed(() => {
    const board = this.snapshot();
    const trainee = this.selected();
    if (!board?.canIssue || !trainee || this.orderReadOnly() || !this.canScheduleSelected()) return false;
    return !!this.missionId() && !!this.instructorId() && !!this.aircraftId() && !!this.dateField.value && !!this.timeField.value;
  });

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.query.set(value);
      this.syncSelection();
    });
    this.timeField.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.shift.set(flightOrderShiftFromTime(value));
    });
    this.reload();
  }

  dateLabel(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return `${day} ${this.copy.months[month - 1]} ${year}`;
  }

  setRoster(value: string): void {
    this.rosterMode.set(value as FlightOrderRosterMode);
    const snapshot = this.snapshot();
    if (snapshot) {
      this.alignProgramFilter(snapshot, true);
      if (value === 'promotion') this.promotionId.set(this.nextPromotionId(snapshot));
    }
    this.syncSelection();
  }

  setPromotion(value: string): void {
    this.promotionId.set(value);
    this.syncSelection();
  }

  setProgram(programId: string): void {
    const trainee = this.selected();
    const next = (this.snapshot()?.trainees ?? []).find(
      (item) => item.userId === trainee?.userId && item.programId === programId,
    );
    if (next) this.select(next.id);
  }

  setTreeModule(value: string): void {
    this.treeModule.set(value as FlightOrderTreeModule);
    const curriculum = this.moduleCurriculum();
    const missions = curriculum ? flattenCurriculumMissions(expandFlightOrderTree(curriculum)) : [];
    const next = missions.find((item) => (FLIGHT_ORDER_SCHEDULABLE as readonly string[]).includes(item.status)) ?? missions[0];
    this.selectedMissionId.set(next?.id ?? null);
    if (next && (FLIGHT_ORDER_SCHEDULABLE as readonly string[]).includes(next.status)) {
      this.missionId.set(next.id);
    }
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.applyTrainee(this.snapshot()?.trainees.find((item) => item.id === id) ?? null);
  }

  pickMission(id: string): void {
    this.selectedMissionId.set(id);
    const curriculum = this.moduleCurriculum();
    if (!curriculum) return;
    const mission = flattenCurriculumMissions(expandFlightOrderTree(curriculum)).find((item) => item.id === id);
    if (mission) this.missionId.set(id);
  }

  openOrder(): void {
    const mission = this.selectedMission();
    if (!mission || this.treeModule() === 'ground') return;
    const viewOnly = mission.status === 'completed';
    if (!viewOnly && !this.canScheduleSelected()) return;
    this.applyMissionForm(mission, viewOnly);
    this.previewOpen.set(true);
  }

  setShift(value: string): void {
    if (this.orderReadOnly()) return;
    const shift = value as FlightOrderShift;
    this.shift.set(shift);
    this.timeField.setValue(FLIGHT_ORDER_SHIFT_TIMES[shift], { emitEvent: false });
  }

  setGroundCourse(courseId: string, loaded: boolean): void {
    const context = this.operationalContext();
    const trainee = this.selected();
    if (!context || !trainee || !this.canLoadGround()) return;
    const ids = new Set(trainee.groundCourseIds);
    if (loaded) ids.add(courseId);
    else ids.delete(courseId);
    this.busy.set(true);
    this.assignGround
      .execute(context, { enrollmentId: trainee.enrollmentId, groundCourseIds: [...ids] })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(this.copy.toastGroundAssigned, this.copy.toastGroundAssignedBody);
          this.reload(trainee.id);
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.toast.error(err instanceof DomainError ? err.message : this.copy.loadError);
        },
      });
  }
  setInstructor(value: string): void {
    this.instructorId.set(value);
  }

  setAircraft(value: string): void {
    this.aircraftId.set(value);
  }

  closePreview(): void {
    this.previewOpen.set(false);
    this.orderReadOnly.set(false);
    this.setOrderFieldsLocked(false);
  }

  emitOrder(): void {
    const context = this.operationalContext();
    const trainee = this.selected();
    const board = this.snapshot();
    if (!context || !trainee || !board?.canIssue || !this.canSubmit()) return;
    this.busy.set(true);
    this.issue
      .execute(context, {
        studentId: trainee.userId,
        programId: trainee.programId,
        missionId: this.missionId(),
        instructorId: this.instructorId(),
        aircraftId: this.aircraftId(),
        date: this.dateField.value,
        scheduledTime: this.timeField.value,
        observations: this.remarksField.value,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (issued) => {
          this.busy.set(false);
          this.previewOpen.set(false);
          this.toast.success(this.copy.toastIssued, `${issued.orderNumber}. ${this.copy.toastIssuedBody}`);
          this.reload(trainee.id);
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.toast.error(err instanceof DomainError ? err.message : this.copy.loadError);
        },
      });
  }

  instructorName(id: string): string {
    return this.snapshot()?.instructors.find((item) => item.id === id)?.name ?? this.copy.none;
  }

  aircraftName(id: string): string {
    return this.snapshot()?.aircraft.find((item) => item.id === id)?.name ?? this.copy.none;
  }

  missionName(id: string): string {
    const node = this.selectedMission();
    if (node && node.id === id) return `${node.code}: ${node.name}`;
    return this.selected()?.missions.find((item) => item.id === id)?.label ?? this.copy.none;
  }

  private reload(keepId?: string): void {
    const context = this.operationalContext();
    if (!context) {
      this.loadState.set('error');
      return;
    }
    this.loadState.set('loading');
    this.board
      .execute(context)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.snapshot.set(snapshot);
          this.alignProgramFilter(snapshot, false);
          this.promotionId.set(this.nextPromotionId(snapshot));
          this.dateField.setValue(snapshot.operationDate);
          const preferred = keepId ?? this.selectedId();
          this.selectedId.set(preferred);
          this.syncSelection();
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  private syncSelection(): void {
    const list = this.visibleTrainees();
    const current = this.selectedId();
    const next =
      list.find((item) => item.id === current)?.id ??
      list.find((item) => item.status === 'ready' || item.status === 'scheduled')?.id ??
      list[0]?.id ??
      null;
    this.selectedId.set(next);
    this.applyTrainee(list.find((item) => item.id === next) ?? null);
  }

  private alignProgramFilter(snapshot: FlightOrderBoard, rosterChanged: boolean): void {
    const focus = snapshot.focusProgramId;
    const inMode = (programId: string): boolean =>
      snapshot.trainees.some((item) => item.source === this.rosterMode() && item.programId === programId);
    if (focus && inMode(focus)) {
      this.programFilter.set(focus);
      return;
    }
    const current = this.programFilter();
    if (!rosterChanged && current !== FLIGHT_ORDER_FILTER_ALL && inMode(current)) return;
    this.programFilter.set(FLIGHT_ORDER_FILTER_ALL);
  }

  private nextPromotionId(snapshot: FlightOrderBoard): string {
    const current = this.promotionId();
    const programId = this.programFilter();
    const matching = snapshot.cohorts.filter((cohort) =>
      snapshot.trainees.some(
        (item) =>
          item.source === 'promotion' &&
          item.promotionId === cohort.promotionId &&
          (programId === FLIGHT_ORDER_FILTER_ALL || item.programId === programId),
      ),
    );
    return matching.find((item) => item.promotionId === current)?.promotionId ?? matching[0]?.promotionId ?? '';
  }

  private applyMissionForm(mission: FlightOrderMissionNode, viewOnly: boolean): void {
    const board = this.snapshot();
    this.orderReadOnly.set(viewOnly);
    this.missionId.set(mission.id);
    this.instructorId.set(mission.instructorId ?? (viewOnly ? '' : board?.instructors[0]?.id ?? ''));
    this.aircraftId.set(mission.aircraftId ?? (viewOnly ? '' : board?.aircraft[0]?.id ?? ''));
    this.dateField.setValue(mission.scheduledDate ?? board?.operationDate ?? isoCalendarDate());
    const time = mission.scheduledTime ?? FLIGHT_ORDER_DEFAULT_TIME;
    this.timeField.setValue(time, { emitEvent: false });
    this.shift.set(flightOrderShiftFromTime(time));
    this.remarksField.setValue(mission.history);
    this.durationField.setValue(String(mission.hours));
    this.setOrderFieldsLocked(viewOnly);
  }

  private setOrderFieldsLocked(locked: boolean): void {
    if (locked) {
      this.dateField.disable({ emitEvent: false });
      this.timeField.disable({ emitEvent: false });
      this.remarksField.disable({ emitEvent: false });
      return;
    }
    this.dateField.enable({ emitEvent: false });
    this.timeField.enable({ emitEvent: false });
    this.remarksField.enable({ emitEvent: false });
  }

  private applyTrainee(trainee: FlightOrderTrainee | null): void {
    const board = this.snapshot();
    this.missionId.set(trainee?.nextMissionId ?? trainee?.missions[0]?.id ?? '');
    this.selectedMissionId.set(trainee?.nextMissionId ?? trainee?.missions[0]?.id ?? null);
    this.instructorId.set(board?.instructors[0]?.id ?? '');
    this.aircraftId.set(board?.aircraft[0]?.id ?? '');
    if (board) this.dateField.setValue(board.operationDate);
    this.timeField.setValue(FLIGHT_ORDER_DEFAULT_TIME);
    this.shift.set(flightOrderShiftFromTime(FLIGHT_ORDER_DEFAULT_TIME));
    this.remarksField.setValue('');
    this.durationField.setValue('');
    this.orderReadOnly.set(false);
    this.setOrderFieldsLocked(false);
  }

  private operationalContext(): OperationalContext | null {
    return this.session.operationalContext();
  }
}

function meanScore(values: readonly number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}
