import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateSubphaseBank,
  ListManeuvers,
  ListMissionTypes,
  ListOperations,
  ListPhaseBanks,
  ListPhases,
  ListPrograms,
  ListSubphaseBanks,
  ListSubphases,
  SaveProgramCurriculum,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import {
  AUTO_MISSION_COUNT_MAX,
  DIRBE_LEVELS,
  PROGRAM_LIFECYCLE_FLAG,
  type DirbeLevel,
  type EntityStatus,
  type ManeuverBankEntity,
  type ManeuverStandardAssignment,
  type MissionTypeEntity,
  type OperationEntity,
  type PhaseBankEntity,
  type MissionAssignMode,
  type PhaseDraftInput,
  type ProgramLifecycleFlag,
  type ProgramModuleKind,
  type ProgramType,
  type GroundPeriodicExamRule,
  type SubphaseBankEntity,
} from '@core/domain/entities';
import {
  curriculumHours,
  curriculumMissionRefs,
  defaultProgramModuleKind,
  defaultSubphaseModuleKind,
  emptyDirbePointDeltas,
  expandAutoMissions,
  isProgramCulminated,
  matchesAdminSearch,
  normalizeProgramLifecycleFlag,
  programTypeLabel,
} from '@core/domain/services/admin-catalog';
import { operationalContextNeedsSquadronPick } from '@core/domain/services/profile-context-policy';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Breadcrumb } from '@shared/components/breadcrumb/breadcrumb';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiAssignBlock } from '@shared/components/ui-assign-block/ui-assign-block';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiChip } from '@shared/components/ui-chip/ui-chip';
import { UiFieldLabel } from '@shared/components/ui-field-label/ui-field-label';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { RippleDirective } from '@shared/directives/ripple.directive';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiOperationBoard } from '@shared/components/ui-operation-board/ui-operation-board';
import { UiPosterField } from '@shared/components/ui-poster-field/ui-poster-field';
import { UiRadioCardGroup } from '@shared/components/ui-radio-card-group/ui-radio-card-group';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ProgramStandardMatrix, type ProgramStandardMatrixCell } from '../../components/program-standard-matrix/program-standard-matrix';
import {
  DIRBE_OPTIONS,
  standardCellKey,
  type ProgramStandardManeuverView,
  type ProgramStandardMissionView,
  type ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';
import {
  CATALOG_CREATE_HOLD_MS,
  academicProgramTypeOptions,
  entityStatusOptions,
  missionAssignModeOptions,
  holdFor,
  touchedError,
} from '../../shared/forms/catalog-form';
import { CURRICULUM_DONUT, PROGRAM_STUDIO_COPY, PROGRAM_STUDIO_ROUTES } from '../../../constants/program-studio.copy.constants';
import { DIRBEP_CODES, PROGRAM_MODULE_OPTIONS, visibleStudioWizardSteps } from '../../../constants/program-studio.wizard.constants';
import {
  GROUND_PERIODIC_EXAMS,
  academicCodeFromName,
  formatGroundDecimal,
  formatGroundInstructionHint,
  periodicExamKindFromPeriod,
} from '@core/domain/services/ground-instruction-grade';
import { EMPTY_GROUND_PERIODIC_DRAFT, EMPTY_GROUND_SUBJECT_DRAFT } from '../../../constants/program-studio.ground.constants';
import type {
  CurriculumHourShare,
  GeneratedMission,
  GroundPeriodicDraft,
  GroundSubjectDraft,
  StudioDirbepCode,
  StudioPhase,
  StudioSubphase,
  StudioWizardStep,
} from '../../../types/program-studio.types';
import { ClientSession } from '../../../../../layout/client-session.service';

@Component({
  selector: 'app-program-studio-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Breadcrumb,
    Button,
    Modal,
    UiAssignBlock,
    UiCheckbox,
    UiChip,
    UiFieldLabel,
    UiInput,
    RippleDirective,
    UiLoading,
    UiOperationBoard,
    UiPosterField,
    UiRadioCardGroup,
    UiSegmentedControl,
    UiSelect,
    ProgramStandardMatrix,
    UiTable,
    UiTextarea,
  ],
  templateUrl: './program-studio.page.html',
  styleUrl: './program-studio.page.scss',
})
export class ProgramStudioPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);
  private readonly listMissionTypes = inject(ListMissionTypes);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly listOperations = inject(ListOperations);
  private readonly saveCurriculum = inject(SaveProgramCurriculum);
  private readonly createSubphaseBank = inject(CreateSubphaseBank);
  private readonly session = inject(ClientSession);
  private readonly toast = inject(ToastService);
  private draftSeq = 1;
  private left = false;
  private readonly fieldControls = new Map<string, FormControl<string> | FormControl<number>>();

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly culminated = signal(false);
  readonly academicYear = signal<number | null>(null);
  readonly lifecycleFlag = signal<ProgramLifecycleFlag>(PROGRAM_LIFECYCLE_FLAG.open);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly copy = PROGRAM_STUDIO_COPY;
  readonly groundGradeHint = formatGroundInstructionHint();
  readonly moduleOptions = PROGRAM_MODULE_OPTIONS;
  readonly selectedModule = signal<ProgramModuleKind | null>(null);
  readonly wizardSteps = computed(() =>
    visibleStudioWizardSteps(this.selectedModule() === 'air' || this.selectedModule() === 'simulator'),
  );
  readonly listHref = PROGRAM_STUDIO_ROUTES.list;
  readonly entityStatusOptions = entityStatusOptions;
  readonly typeOptions = academicProgramTypeOptions;
  readonly missionModeOptions = missionAssignModeOptions;
  readonly autoMissionCountMax = AUTO_MISSION_COUNT_MAX;
  readonly draftMissionName = signal<Record<string, string>>({});
  readonly draftGroundSubjects = signal<Record<string, GroundSubjectDraft>>({});
  readonly draftPeriodicExam = signal<GroundPeriodicDraft>({ ...EMPTY_GROUND_PERIODIC_DRAFT });
  readonly phaseBanks = signal<PhaseBankEntity[]>([]);
  readonly subphaseBanks = signal<SubphaseBankEntity[]>([]);
  readonly missions = signal<MissionTypeEntity[]>([]);
  readonly maneuvers = signal<ManeuverBankEntity[]>([]);
  readonly operations = signal<OperationEntity[]>([]);
  readonly phases = signal<StudioPhase[]>([]);
  readonly step = signal<StudioWizardStep>('plan');
  readonly enabledModules = signal<Record<ProgramModuleKind, boolean>>({
    ground: false,
    air: false,
    simulator: false,
  });
  readonly architectureKind = signal<ProgramModuleKind>('air');
  readonly matrixTarget = signal<{ phaseKey: string; subKey: string } | null>(null);
  readonly matrixExpanded = signal(false);
  readonly calibratorCell = signal<ProgramStandardMatrixCell | null>(null);
  readonly calibratorLevel = signal<DirbeLevel | null>(null);
  readonly dirbeOptions = DIRBE_OPTIONS;
  readonly dirbepCodes = DIRBEP_CODES;
  readonly calibratorStandardIds = signal<string[]>([]);
  readonly calibratorDangerFail = signal(false);
  readonly calibratorAdds: Record<StudioDirbepCode, FormControl<number>> = {
    D: new FormControl(0, { nonNullable: true }),
    I: new FormControl(0, { nonNullable: true }),
    R: new FormControl(0, { nonNullable: true }),
    B: new FormControl(0, { nonNullable: true }),
    E: new FormControl(0, { nonNullable: true }),
    P: new FormControl(0, { nonNullable: true }),
  };
  readonly calibratorSubs: Record<StudioDirbepCode, FormControl<number>> = {
    D: new FormControl(0, { nonNullable: true }),
    I: new FormControl(0, { nonNullable: true }),
    R: new FormControl(0, { nonNullable: true }),
    B: new FormControl(0, { nonNullable: true }),
    E: new FormControl(0, { nonNullable: true }),
    P: new FormControl(0, { nonNullable: true }),
  };
  readonly stepError = signal<string | null>(null);
  readonly collapsedPhaseKeys = signal<string[]>([]);
  readonly nextPhaseBankId = signal('');
  readonly nextSubphaseBankId = signal<Record<string, string>>({});
  readonly phaseBankPickerKey = signal<string | null>(null);
  readonly phaseBankSearch = new FormControl('', { nonNullable: true });
  readonly phaseBankQuery = signal('');
  readonly pickerSelectedId = signal<string | null>(null);
  readonly phasePickerPageSizes = [4] as const;
  readonly phasePickerColumns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
    { id: 'use', header: 'Uso' },
  ];
  readonly courseColumns: UiTableColumn[] = [
    { id: 'name', header: PROGRAM_STUDIO_COPY.colSubject },
    { id: 'hours', header: PROGRAM_STUDIO_COPY.colHours },
    { id: 'coefficient', header: PROGRAM_STUDIO_COPY.colCoefficient },
    { id: 'minGrade', header: PROGRAM_STUDIO_COPY.colMinGrade },
  ];
  readonly periodicColumns: UiTableColumn[] = [
    { id: 'period', header: PROGRAM_STUDIO_COPY.colPeriod },
    { id: 'exam', header: PROGRAM_STUDIO_COPY.colExam },
    { id: 'minGrade', header: PROGRAM_STUDIO_COPY.colMinGrade },
    { id: 'weight', header: PROGRAM_STUDIO_COPY.colWeight },
  ];
  readonly periodicExams = signal<GroundPeriodicExamRule[]>([]);
  readonly periodicRows = computed<UiTableRow[]>(() =>
    this.periodicExams().map((item) => ({
      id: item.id,
      cells: {
        period: item.period,
        exam: item.exam,
        minGrade: formatGroundDecimal(item.minPassingGrade),
        weight: item.countsTowardNei ? formatGroundDecimal(item.neiWeight) : PROGRAM_STUDIO_COPY.none,
      },
    })),
  );
  readonly missionPickerTarget = signal<{ phaseKey: string; subKey: string } | null>(null);
  readonly generatedSelectedId = signal<string | null>(null);
  readonly missionCreateMode = signal<MissionAssignMode>('manual');
  readonly missionAdding = signal(false);
  readonly missionPickerPageSizes = [4] as const;
  readonly generatedMissionColumns: UiTableColumn[] = [
    { id: 'mission', header: 'Misión' },
    { id: 'origin', header: 'Modo' },
  ];
  readonly maneuverPickerTarget = signal<{ phaseKey: string; subKey: string } | null>(null);
  readonly maneuverSearch = new FormControl('', { nonNullable: true });
  readonly maneuverQuery = signal('');
  readonly maneuverCheckedIds = signal<string[]>([]);
  readonly maneuverPickerMode = signal<'add' | 'order'>('add');
  readonly maneuverPickerView = signal<'catalog' | 'grouped'>('catalog');
  readonly maneuverOperationOrder = signal<string[]>([]);
  readonly maneuverBoardOrder = signal<string[]>([]);
  readonly maneuverAssignment = signal<Record<string, string>>({});
  readonly maneuverPickerPageSizes = [8] as const;
  readonly maneuverPickerColumns: UiTableColumn[] = [
    { id: 'code', header: 'Código' },
    { id: 'name', header: 'Nombre' },
    { id: 'description', header: 'Descripción' },
    { id: 'use', header: 'Uso' },
  ];

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    programType: new FormControl<ProgramType>('PPL', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
    imageUrl: new FormControl('', { nonNullable: true }),
  });
  readonly formTick = signal(0);

  readonly title = computed(() => this.stepLabel(this.step()));

  readonly lead = computed(() => {
    if (this.isReadOnly()) {
      return 'Consulta el plan, los módulos, la arquitectura y la matriz del programa.';
    }
    switch (this.step()) {
      case 'plan':
        return 'Código, nombre, tipo, descripción y estado del programa.';
      case 'modules':
        return this.copy.modulesLead;
      case 'architecture':
        return 'Organiza fases y subfases en aire o simulador, o cursos en tierra.';
      default:
        return 'Elige la subfase y, si falta, asigna misiones y maniobras para ver su matriz.';
    }
  });

  readonly enabledPhases = computed(() => {
    const kind = this.selectedModule();
    if (!kind) return [];
    return this.phases().filter((phase) => phase.moduleKind === kind);
  });

  readonly totalHours = computed(() => curriculumHours(this.enabledPhases()));
  readonly phaseCount = computed(() => this.enabledPhases().length);
  readonly subphaseCount = computed(() =>
    this.enabledPhases().reduce((total, phase) => total + phase.subphases.length, 0),
  );
  readonly totalMissions = computed(() =>
    this.enabledPhases().reduce(
      (total, phase) => total + phase.subphases.reduce((sum, sub) => sum + this.missionLabels(sub).length, 0),
      0,
    ),
  );
  readonly programTypeText = computed(() => {
    this.formTick();
    return programTypeLabel(this.form.controls.programType.value);
  });
  readonly needsSquadron = computed(() => {
    const context = this.session.operationalContext();
    return context ? operationalContextNeedsSquadronPick(context) : false;
  });
  readonly hourShares = computed<CurriculumHourShare[]>(() => {
    const total = this.totalHours();
    const ring = CURRICULUM_DONUT.circumference;
    let offset = 0;
    return this.enabledPhases().map((phase) => {
      const hours = this.phaseHours(phase);
      const percent = total > 0 ? Math.round((hours / total) * 1000) / 10 : 0;
      const length = (percent / 100) * ring;
      const share: CurriculumHourShare = {
        id: phase.key,
        label: this.selectedModule() === 'ground' ? this.courseTitle(phase.phaseBankId) : this.phaseName(phase.phaseBankId),
        hours,
        percent,
        dasharray: `${length} ${ring}`,
        dashoffset: -offset,
      };
      offset += length;
      return share;
    });
  });
  readonly progression = computed(() => {
    const ground = this.selectedModule() === 'ground';
    return this.enabledPhases().map((phase, index) => ({
      id: phase.key,
      title: ground ? this.courseTitle(phase.phaseBankId) : this.phaseName(phase.phaseBankId),
      detail: index === 0
        ? ground
          ? this.copy.firstCourseGate
          : this.copy.firstPhaseGate
        : ground
          ? this.copy.nextCourseGate
          : this.copy.nextPhaseGate,
    }));
  });

  readonly hasFlightModules = computed(() => {
    const kind = this.selectedModule();
    return kind === 'air' || kind === 'simulator';
  });

  readonly flightTargets = computed(() => {
    const kind = this.selectedModule();
    if (kind !== 'air' && kind !== 'simulator') return [];
    return this.phases().flatMap((phase) => {
      if (phase.moduleKind !== kind) return [];
      return phase.subphases.map((sub) => ({
        phaseKey: phase.key,
        subKey: sub.key,
        value: `${phase.key}:${sub.key}`,
        label: `${this.phaseName(phase.phaseBankId)} · ${this.subphaseName(sub.subphaseBankId)}`,
      }));
    });
  });

  readonly activeMatrixTarget = computed(() => {
    const selected = this.matrixTarget();
    const targets = this.flightTargets();
    if (selected && targets.some((item) => item.phaseKey === selected.phaseKey && item.subKey === selected.subKey)) {
      return selected;
    }
    const first = targets[0];
    return first ? { phaseKey: first.phaseKey, subKey: first.subKey } : null;
  });

  readonly activeMatrixSub = computed(() => {
    const target = this.activeMatrixTarget();
    if (!target) return null;
    const phase = this.phases().find((item) => item.key === target.phaseKey);
    const sub = phase?.subphases.find((item) => item.key === target.subKey) ?? null;
    return phase && sub ? { phase, sub } : null;
  });

  readonly matrixReady = computed(() => {
    const current = this.activeMatrixSub();
    return current ? this.subphaseReadyForMatrix(current.sub) : false;
  });

  readonly matrixSubphaseView = computed(() => {
    const current = this.activeMatrixSub();
    return current ? this.toMatrixSubphaseView(current.phase, current.sub) : null;
  });

  readonly matrixAssignmentMap = computed<Readonly<Record<string, DirbeLevel | null>>>(() => {
    const current = this.activeMatrixSub();
    if (!current) return {};
    const map: Record<string, DirbeLevel | null> = {};
    for (const assignment of current.sub.standardAssignments) {
      map[standardCellKey(assignment.missionKey, assignment.maneuverId)] = assignment.dirbeLevel ?? null;
    }
    return map;
  });

  readonly usedPhaseBankIds = computed(() => new Set(this.phases().map((item) => item.phaseBankId)));

  readonly unusedPhaseBanks = computed(() =>
    this.phaseBanks().filter((item) => item.status === 'active' && !this.usedPhaseBankIds().has(item.id)),
  );

  phaseBankOptionsFor(kind: ProgramModuleKind): ChoiceOption[] {
    return this.unusedPhaseBanks()
      .filter((item) => defaultProgramModuleKind(item.id) === kind)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }));
  }

  nextAvailablePhaseBankIdFor(kind: ProgramModuleKind): string {
    const chosen = this.nextPhaseBankId();
    const unused = this.unusedPhaseBanks().filter((item) => defaultProgramModuleKind(item.id) === kind);
    if (unused.some((item) => item.id === chosen)) return chosen;
    return unused[0]?.id ?? '';
  }

  subphaseBankOptionsFor(kind: ProgramModuleKind): ChoiceOption[] {
    return this.subphaseBanks()
      .filter((item) => item.status === 'active' && defaultSubphaseModuleKind(item) === kind)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }));
  }

  readonly currentPickerBankId = computed(() => {
    const key = this.phaseBankPickerKey();
    return this.phases().find((item) => item.key === key)?.phaseBankId ?? '';
  });

  readonly pickerPhaseBanks = computed(() =>
    this.phaseBanks()
      .filter((item) => item.status === 'active')
      .filter((item) => matchesAdminSearch([item.code, item.name, item.description], this.phaseBankQuery())),
  );

  readonly pickerTableRows = computed<UiTableRow[]>(() => {
    const currentId = this.currentPickerBankId();
    const used = this.usedPhaseBankIds();
    return this.pickerPhaseBanks().map((item) => ({
      id: item.id,
      cells: {
        code: item.code,
        name: item.name,
        description: item.description || '—',
        use: item.id === currentId ? 'En el programa' : used.has(item.id) ? 'En uso' : 'Disponible',
      },
    }));
  });

  readonly canApplyPickerPhase = computed(() => {
    const id = this.pickerSelectedId();
    if (!id) return false;
    return id === this.currentPickerBankId() || !this.usedPhaseBankIds().has(id);
  });

  readonly phaseBankOpen = computed(() => this.phaseBankPickerKey() !== null);

  readonly missionPickerOpen = computed(() => this.missionPickerTarget() !== null);
  readonly currentMissionPhaseKey = computed(() => this.missionPickerTarget()?.phaseKey ?? '');

  readonly currentPickerSub = computed(() => {
    const target = this.missionPickerTarget();
    if (!target) return null;
    const phase = this.phases().find((item) => item.key === target.phaseKey);
    return phase?.subphases.find((item) => item.key === target.subKey) ?? null;
  });

  readonly generatedMissions = computed(() => this.buildGeneratedMissions(this.currentPickerSub()));

  readonly generatedMissionRows = computed<UiTableRow[]>(() =>
    this.generatedMissions().map((item) => ({
      id: item.key,
      cells: { mission: item.label, origin: item.origin },
    })),
  );

  readonly maneuverPickerOpen = computed(() => this.maneuverPickerTarget() !== null);

  readonly currentManeuverSub = computed(() => {
    const target = this.maneuverPickerTarget();
    if (!target) return null;
    const phase = this.phases().find((item) => item.key === target.phaseKey);
    return phase?.subphases.find((item) => item.key === target.subKey) ?? null;
  });

  readonly maneuverPickerRows = computed<UiTableRow[]>(() =>
    this.toManeuverRows(
      this.maneuvers().filter((item) =>
        matchesAdminSearch([item.code, item.name, item.description], this.maneuverQuery()),
      ),
    ),
  );

  readonly canGroupManeuvers = computed(() => this.maneuverCheckedIds().length > 0);

  readonly maneuverCrumbs = computed(() => [
    { label: 'Catálogo', action: 'catalog' },
    { label: 'Por operaciones' },
  ]);

  readonly maneuverBoardOperations = computed(() =>
    this.operations().map((item) => ({ id: item.id, name: item.name, description: item.description })),
  );

  readonly maneuverBoardItems = computed(() => {
    const selected = new Set(this.maneuverCheckedIds());
    const assigned = new Set(this.currentManeuverSub()?.maneuverIds ?? []);
    return this.maneuvers()
      .filter((item) => selected.has(item.id))
      .map((item) => ({
        id: item.id,
        label: `${item.code} · ${item.name}`,
        added: assigned.has(item.id),
      }));
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    this.phaseBankSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.phaseBankQuery.set(value);
    });
    this.maneuverSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.maneuverQuery.set(value);
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((value) => value + 1);
    });
    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
      phaseBanks: this.listPhaseBanks.execute(),
      subphaseBanks: this.listSubphaseBanks.execute(),
      missions: this.listMissionTypes.execute(),
      maneuvers: this.listManeuvers.execute(),
      operations: this.listOperations.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bundle) => {
          this.phaseBanks.set(bundle.phaseBanks);
          this.subphaseBanks.set(bundle.subphaseBanks);
          this.missions.set(bundle.missions);
          this.maneuvers.set(bundle.maneuvers);
          this.operations.set(bundle.operations);
          this.nextPhaseBankId.set(bundle.phaseBanks.find((item) => item.status === 'active')?.id ?? '');
          if (this.editingId) {
            const program = bundle.programs.find((item) => item.id === this.editingId);
            if (!program) {
              this.loadState.set('error');
              return;
            }
            this.culminated.set(isProgramCulminated(program));
            this.academicYear.set(program.academicYear ?? null);
            this.lifecycleFlag.set(normalizeProgramLifecycleFlag(program.lifecycleFlag));
            this.form.reset({
              code: program.code,
              name: program.name,
              programType: program.programType,
              description: program.description,
              status: program.status,
              imageUrl: program.imageUrl,
            });
            this.periodicExams.set(
              program.groundPeriodicExams?.length
                ? program.groundPeriodicExams.map((item) => ({ ...item }))
                : program.programType === 'HELI'
                  ? GROUND_PERIODIC_EXAMS.map((item) => ({ ...item }))
                  : [],
            );
            const programPhases = bundle.phases
              .filter((item) => item.programId === program.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            this.phases.set(
              programPhases.map((phase) => ({
                key: phase.id,
                phaseBankId: phase.phaseBankId,
                moduleKind: phase.moduleKind ?? defaultProgramModuleKind(phase.phaseBankId),
                subphases: bundle.subphases
                  .filter((item) => item.phaseId === phase.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => ({
                    key: item.id,
                    subphaseBankId: item.subphaseBankId,
                    hours: item.hours,
                    missionMode: item.missionMode,
                    missionTypeIds: [...item.missionTypeIds],
                    customMissionNames: [...item.customMissionNames],
                    autoMissionCode: item.autoMissionCode,
                    autoMissionCount: item.autoMissionCount,
                    maneuverIds: [...item.maneuverIds],
                    maneuverOperationIds: [...item.maneuverOperationIds],
                    maneuverAssignment: { ...item.maneuverAssignment },
                    standardAssignments: item.standardAssignments.map((assignment) => ({
                      ...assignment,
                      standardIds: [...assignment.standardIds],
                    })),
                  })),
              })),
            );
            const present: Record<ProgramModuleKind, boolean> = { ground: false, air: false, simulator: false };
            for (const phase of this.phases()) {
              present[phase.moduleKind] = true;
            }
            const selected: ProgramModuleKind | null = present.air
              ? 'air'
              : present.simulator
                ? 'simulator'
                : present.ground
                  ? 'ground'
                  : null;
            this.selectedModule.set(selected);
            this.enabledModules.set(present);
            this.architectureKind.set(selected ?? 'ground');
            const firstFlight = this.phases().find(
              (phase) => (phase.moduleKind === 'air' || phase.moduleKind === 'simulator') && phase.subphases[0],
            );
            this.matrixTarget.set(
              firstFlight
                ? { phaseKey: firstFlight.key, subKey: firstFlight.subphases[0].key }
                : null,
            );
            if (this.isReadOnly()) this.form.disable({ emitEvent: false });
          }
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  isReadOnly(): boolean {
    return this.isView || this.culminated();
  }

  requiredError(name: 'code' | 'name', fallback: string): string | undefined {
    return touchedError(this.form.controls[name], fallback);
  }

  stepLabel(step: StudioWizardStep): string {
    if (step === 'plan') return this.copy.stepPlan;
    if (step === 'modules') return this.copy.stepModules;
    if (step === 'architecture') return this.copy.stepArchitecture;
    return this.copy.stepMatrix;
  }

  planValid(): boolean {
    this.formTick();
    return this.form.controls.code.valid && this.form.controls.name.valid;
  }

  modulesValid(): boolean {
    const selected = this.selectedModule();
    return selected !== null && this.enabledModules()[selected];
  }

  architectureValid(): boolean {
    const kind = this.selectedModule();
    if (!kind || !this.enabledModules()[kind]) return false;
    return this.phasesOf(kind).some((phase) => phase.subphases.length > 0);
  }

  allEnabledArchitectureValid(): boolean {
    return (['ground', 'air', 'simulator'] as const).every((kind) => {
      if (!this.enabledModules()[kind]) return true;
      return this.phasesOf(kind).some((phase) => phase.subphases.length > 0);
    });
  }

  matrixValid(): boolean {
    return (['air', 'simulator'] as const).every((kind) => {
      if (!this.enabledModules()[kind]) return true;
      return this.phasesOf(kind).every(
        (phase) => phase.subphases.length > 0 && phase.subphases.every((sub) => this.subphaseReadyForMatrix(sub)),
      );
    });
  }

  stepValid(step: StudioWizardStep): boolean {
    if (step === 'plan') return this.planValid();
    if (step === 'modules') return this.modulesValid();
    if (step === 'architecture') return this.architectureValid();
    return this.matrixValid();
  }

  canVisitStep(step: StudioWizardStep): boolean {
    if (step === 'matrix' && this.selectedModule() !== 'air' && this.selectedModule() !== 'simulator') return false;
    if (this.isReadOnly()) return true;
    const steps = this.wizardSteps();
    const index = steps.indexOf(step);
    if (index < 0) return false;
    return steps.slice(0, index).every((item) => this.stepValid(item));
  }

  goToStep(step: StudioWizardStep): void {
    if (!this.canVisitStep(step)) {
      const blocked = this.wizardSteps().find((item) => !this.stepValid(item));
      this.stepError.set(blocked ? this.gateMessage(blocked) : this.copy.planGate);
      return;
    }
    this.stepError.set(null);
    this.step.set(step);
    if (step !== 'matrix') this.matrixExpanded.set(false);
  }

  goNext(): void {
    const current = this.step();
    if (current === 'plan') this.form.markAllAsTouched();
    if (!this.stepValid(current)) {
      this.stepError.set(this.gateMessage(current));
      return;
    }
    const steps = this.wizardSteps();
    const next = steps[steps.indexOf(current) + 1];
    if (!next) return;
    this.stepError.set(null);
    this.step.set(next);
    if (next !== 'matrix') this.matrixExpanded.set(false);
  }

  goPrev(): void {
    const steps = this.wizardSteps();
    const previous = steps[steps.indexOf(this.step()) - 1];
    if (!previous) return;
    this.stepError.set(null);
    this.step.set(previous);
    this.matrixExpanded.set(false);
  }

  canContinue(): boolean {
    const steps = this.wizardSteps();
    return steps.indexOf(this.step()) < steps.length - 1;
  }

  nextLabel(): string {
    if (this.step() === 'modules') {
      const kind = this.selectedModule();
      const title = kind ? this.moduleChoiceTitle(kind) : null;
      return title ? `${this.copy.next} ${title}` : this.copy.next;
    }
    return this.copy.next;
  }

  moduleChoiceTitle(kind: ProgramModuleKind): string {
    return PROGRAM_MODULE_OPTIONS.find((item) => item.kind === kind)?.title ?? this.moduleTitle(kind);
  }

  gateMessage(step: StudioWizardStep): string {
    if (step === 'plan') return this.copy.planGate;
    if (step === 'modules') return this.copy.modulesGate;
    if (step === 'architecture') return this.copy.architectureGate;
    return this.copy.matrixGate;
  }

  firstInvalidStep(): StudioWizardStep | null {
    if (!this.planValid()) return 'plan';
    if (!this.modulesValid()) return 'modules';
    if (!this.allEnabledArchitectureValid()) return 'architecture';
    if (this.enabledModules().air && !this.matrixValid()) return 'matrix';
    if (this.enabledModules().simulator && !this.matrixValid()) return 'matrix';
    return null;
  }

  selectModule(kind: ProgramModuleKind): void {
    if (!this.isReadOnly()) {
      this.enabledModules.update((current) => ({ ...current, [kind]: true }));
    }
    this.selectedModule.set(kind);
    this.architectureKind.set(kind);
    if (kind !== 'air' && kind !== 'simulator' && this.step() === 'matrix') this.step.set('architecture');
  }

  setAdvanceModule(kind: ProgramModuleKind, checked: boolean): void {
    if (this.isReadOnly()) return;
    if (checked) {
      this.selectModule(kind);
      return;
    }
    if (this.selectedModule() === kind) this.selectedModule.set(null);
  }

  toggleModule(kind: ProgramModuleKind): void {
    this.selectModule(kind);
  }

  setModuleEnabled(kind: ProgramModuleKind, enabled: boolean): void {
    if (this.isReadOnly()) return;
    this.enabledModules.update((current) => ({ ...current, [kind]: enabled }));
    const selected = this.selectedModule();
    if (enabled && !selected) {
      this.selectedModule.set(kind);
      this.architectureKind.set(kind);
      return;
    }
    if (!enabled && selected === kind) {
      const next = (['ground', 'air', 'simulator'] as const).find((item) => item !== kind && this.enabledModules()[item]);
      this.selectedModule.set(next ?? null);
      if (next) this.architectureKind.set(next);
      if (next !== 'air' && this.step() === 'matrix') this.step.set('architecture');
    }
  }

  moduleEnabled(kind: ProgramModuleKind): boolean {
    return this.enabledModules()[kind];
  }

  moduleAdvance(kind: ProgramModuleKind): boolean {
    return this.selectedModule() === kind;
  }

  phasesOf(kind: ProgramModuleKind): StudioPhase[] {
    return this.phases().filter((phase) => phase.moduleKind === kind);
  }

  moduleTitle(kind: ProgramModuleKind): string {
    if (kind === 'ground') return this.copy.architectureGround;
    if (kind === 'simulator') return this.copy.architectureSim;
    return this.copy.architectureAir;
  }

  setMatrixTargetValue(value: string): void {
    const [phaseKey, subKey] = value.split(':');
    if (!phaseKey || !subKey) return;
    this.matrixTarget.set({ phaseKey, subKey });
    this.calibratorCell.set(null);
    this.calibratorLevel.set(null);
  }

  matrixSelectValue(): string {
    const target = this.activeMatrixTarget();
    return target ? `${target.phaseKey}:${target.subKey}` : '';
  }

  courseRows(phase: StudioPhase): UiTableRow[] {
    return phase.subphases.map((sub) => {
      const bank = this.subphaseBanks().find((item) => item.id === sub.subphaseBankId);
      return {
        id: `${phase.key}:${sub.key}`,
        cells: {
          name: this.subphaseName(sub.subphaseBankId),
          hours: `${this.formatDecimal(sub.hours)} ${this.copy.hoursUnit}`,
          coefficient: this.formatDecimal(bank?.coefficient),
          minGrade: this.formatDecimal(bank?.minPassingGrade),
        },
      };
    });
  }

  removeCourse(rowId: string): void {
    const [phaseKey, subKey] = rowId.split(':');
    if (phaseKey && subKey) this.removeSubphase(phaseKey, subKey);
  }

  subphaseReadyForMatrix(sub: StudioSubphase): boolean {
    return curriculumMissionRefs(sub).length > 0 && sub.maneuverIds.length > 0;
  }

  toggleMatrixExpanded(): void {
    this.matrixExpanded.update((value) => !value);
  }

  selectMatrixCell(cell: ProgramStandardMatrixCell): void {
    if (this.isReadOnly()) return;
    const current = this.activeMatrixSub();
    const assignment = current?.sub.standardAssignments.find(
      (item) => item.missionKey === cell.mission.key && item.maneuverId === cell.maneuver.id,
    );
    const adds = { ...emptyDirbePointDeltas(), ...assignment?.dirbePointAdds };
    const subs = { ...emptyDirbePointDeltas(), ...assignment?.dirbePointSubs };
    if (!assignment?.dirbePointAdds && !assignment?.dirbePointSubs) {
      for (const level of DIRBE_LEVELS) {
        const delta = assignment?.dirbePointDeltas?.[level] ?? 0;
        if (delta > 0) adds[level] = delta;
        if (delta < 0) subs[level] = Math.abs(delta);
      }
    }
    this.calibratorCell.set(cell);
    this.calibratorLevel.set(assignment?.dirbeLevel ?? null);
    this.calibratorStandardIds.set([...(assignment?.standardIds ?? [])]);
    for (const level of DIRBE_LEVELS) {
      this.calibratorAdds[level].setValue(adds[level], { emitEvent: false });
      this.calibratorSubs[level].setValue(subs[level], { emitEvent: false });
    }
    this.calibratorAdds.P.setValue(assignment?.dangerousAdd ?? 0, { emitEvent: false });
    this.calibratorSubs.P.setValue(assignment?.dangerousSub ?? 0, { emitEvent: false });
    this.calibratorDangerFail.set(assignment?.dangerousOutcome === 'fail-mission');
  }

  applyCalibrator(): void {
    const cell = this.calibratorCell();
    const current = this.activeMatrixSub();
    if (!cell || !current) return;
    const standardIds = [...this.calibratorStandardIds()];
    const dirbeLevel = this.calibratorLevel();
    const dirbePointAdds = this.compactDirbeScores((level) => this.calibratorAdds[level].value);
    const dirbePointSubs = this.compactDirbeScores((level) => this.calibratorSubs[level].value);
    const dirbePointDeltas = this.compactDirbeScores(
      (level) => this.calibratorAdds[level].value - this.calibratorSubs[level].value,
    );
    const pAdd = this.calibratorAdds.P.value;
    const pSub = this.calibratorSubs.P.value;
    const failMission = this.calibratorDangerFail();
    const next: ManeuverStandardAssignment = {
      missionKey: cell.mission.key,
      maneuverId: cell.maneuver.id,
      standardIds,
      ...(dirbeLevel ? { dirbeLevel } : {}),
      ...(dirbePointAdds ? { dirbePointAdds } : {}),
      ...(dirbePointSubs ? { dirbePointSubs } : {}),
      ...(dirbePointDeltas ? { dirbePointDeltas } : {}),
      ...(failMission
        ? { dangerousOutcome: 'fail-mission' as const }
        : pAdd || pSub
          ? { dangerousOutcome: 'deduct' as const }
          : {}),
      ...(pAdd ? { dangerousAdd: pAdd } : {}),
      ...(pSub ? { dangerousSub: pSub } : {}),
    };
    const assignments = [...current.sub.standardAssignments];
    const index = assignments.findIndex(
      (item) => item.missionKey === cell.mission.key && item.maneuverId === cell.maneuver.id,
    );
    const hasBody = Boolean(
      next.standardIds.length || next.dirbeLevel || dirbePointAdds || dirbePointSubs || pAdd || pSub || failMission,
    );
    if (!hasBody) {
      if (index >= 0) assignments.splice(index, 1);
    } else if (index >= 0) {
      assignments[index] = next;
    } else {
      assignments.push(next);
    }
    this.patchSubphase(current.phase.key, current.sub.key, { standardAssignments: assignments });
    this.closeCalibrator();
  }

  closeCalibrator(): void {
    this.calibratorCell.set(null);
    this.calibratorLevel.set(null);
    this.calibratorStandardIds.set([]);
    this.calibratorDangerFail.set(false);
  }

  toggleCalibratorLevel(level: DirbeLevel): void {
    if (this.calibratorLevel() === level) {
      this.calibratorLevel.set(null);
      this.clearCalibratorScores();
      return;
    }
    this.calibratorLevel.set(level);
  }

  clearCalibratorScores(): void {
    for (const code of DIRBEP_CODES) {
      this.calibratorAdds[code].setValue(0, { emitEvent: false });
      this.calibratorSubs[code].setValue(0, { emitEvent: false });
    }
    this.calibratorDangerFail.set(false);
  }

  calibratorAddVisible(code: StudioDirbepCode): boolean {
    return this.calibratorAdds[code].value > 0;
  }

  calibratorSubVisible(code: StudioDirbepCode): boolean {
    return this.calibratorSubs[code].value > 0;
  }

  calibratorScoreCardOn(code: StudioDirbepCode): boolean {
    if (code === 'P') return this.calibratorDangerFail();
    return this.calibratorLevel() === code;
  }

  bumpCalibratorScore(code: StudioDirbepCode, step: 1 | -1): void {
    const net = this.calibratorAdds[code].value - this.calibratorSubs[code].value + step;
    if (net >= 0) {
      this.calibratorAdds[code].setValue(net);
      this.calibratorSubs[code].setValue(0);
      return;
    }
    this.calibratorAdds[code].setValue(0);
    this.calibratorSubs[code].setValue(Math.abs(net));
  }

  onCalibratorAddTyped(code: StudioDirbepCode): void {
    const value = Math.max(0, this.calibratorAdds[code].value || 0);
    this.calibratorAdds[code].setValue(value);
    if (value > 0) this.calibratorSubs[code].setValue(0);
  }

  onCalibratorSubTyped(code: StudioDirbepCode): void {
    const value = Math.max(0, this.calibratorSubs[code].value || 0);
    this.calibratorSubs[code].setValue(value);
    if (value > 0) this.calibratorAdds[code].setValue(0);
  }

  toggleCalibratorDischarge(): void {
    this.calibratorDangerFail.update((value) => !value);
  }

  calibratorCardClass(code: DirbeLevel | 'P', selected: boolean): string {
    const tone = code.toLowerCase();
    return `calibrator__card calibrator__card--${tone}${selected ? ' calibrator__card--on' : ''}`;
  }

  calibratorAddField(code: StudioDirbepCode): FormControl<number> {
    return this.calibratorAdds[code];
  }

  calibratorSubField(code: StudioDirbepCode): FormControl<number> {
    return this.calibratorSubs[code];
  }

  dirbepLabel(code: StudioDirbepCode): string {
    if (code === 'P') return this.copy.calibratorDangerGrade;
    return this.dirbeOptions.find((item) => item.value === code)?.label ?? code;
  }

  private compactDirbeScores(read: (level: DirbeLevel) => number): Partial<Record<DirbeLevel, number>> | undefined {
    const result: Partial<Record<DirbeLevel, number>> = {};
    for (const level of DIRBE_LEVELS) {
      const value = read(level);
      if (value) result[level] = value;
    }
    return Object.keys(result).length ? result : undefined;
  }

  calibratorTargetLabel(): string {
    const level = this.calibratorLevel();
    return this.dirbeOptions.find((item) => item.value === level)?.label ?? '';
  }

  phaseName(phaseBankId: string): string {
    const bank = this.phaseBanks().find((item) => item.id === phaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : this.copy.phaseMeta;
  }

  courseTitle(phaseBankId: string): string {
    const bank = this.phaseBanks().find((item) => item.id === phaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : this.copy.courseKicker;
  }

  phaseDescription(phaseBankId: string): string {
    return this.phaseBanks().find((item) => item.id === phaseBankId)?.description ?? '';
  }

  subphaseName(subphaseBankId: string): string {
    const bank = this.subphaseBanks().find((item) => item.id === subphaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : this.copy.subphaseAction;
  }

  formatDecimal(value: number | undefined): string {
    if (value === undefined) return this.copy.none;
    return formatGroundDecimal(value);
  }

  curriculumHoursOf(kind: ProgramModuleKind): number {
    return curriculumHours(this.phasesOf(kind));
  }

  phaseHours(phase: StudioPhase): number {
    return curriculumHours([phase]);
  }

  phaseMissionCount(phase: StudioPhase): number {
    return phase.subphases.reduce((total, sub) => total + this.missionLabels(sub).length, 0);
  }

  phaseShare(phase: StudioPhase): number {
    const total = this.totalHours();
    if (!total) return 0;
    return Math.round((this.phaseHours(phase) / total) * 1000) / 10;
  }

  isPhaseCollapsed(key: string): boolean {
    return this.collapsedPhaseKeys().includes(key);
  }

  togglePhase(key: string): void {
    this.collapsedPhaseKeys.update((keys) =>
      keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key],
    );
  }

  collapseAll(): void {
    this.collapsedPhaseKeys.set(this.enabledPhases().map((item) => item.key));
  }

  expandAll(): void {
    this.collapsedPhaseKeys.set([]);
  }

  hoursLabel(value: number): string {
    return `${value} ${this.copy.hoursUnit}`;
  }

  setType(value: string): void {
    if (this.isReadOnly()) return;
    if (
      value === 'PPL' ||
      value === 'CPL' ||
      value === 'ATPL' ||
      value === 'IR' ||
      value === 'FI' ||
      value === 'HELI'
    ) {
      this.form.controls.programType.setValue(value);
    }
  }

  setStatus(value: string): void {
    if (this.isReadOnly()) return;
    this.form.controls.status.setValue(value === 'inactive' ? 'inactive' : 'active');
  }

  setPoster(value: string): void {
    if (this.isReadOnly()) return;
    this.form.controls.imageUrl.setValue(value);
    this.form.controls.imageUrl.markAsTouched();
    this.error.set(null);
  }

  onPosterReject(message: string): void {
    this.error.set(message);
  }

  openPhaseBankPicker(key: string): void {
    if (this.isReadOnly()) return;
    this.phaseBankSearch.setValue('');
    this.phaseBankQuery.set('');
    this.phaseBankPickerKey.set(key);
    this.pickerSelectedId.set(this.phases().find((item) => item.key === key)?.phaseBankId ?? null);
  }

  closePhaseBankPicker(): void {
    this.phaseBankPickerKey.set(null);
    this.pickerSelectedId.set(null);
  }

  applyPickerPhase(): void {
    const id = this.pickerSelectedId();
    if (id) this.pickPhaseBank(id);
  }

  openMissionPicker(phaseKey: string, subKey: string): void {
    if (this.isReadOnly()) return;
    const sub = this.phases()
      .find((item) => item.key === phaseKey)
      ?.subphases.find((item) => item.key === subKey);
    if (!sub) return;
    this.missionPickerTarget.set({ phaseKey, subKey });
    this.generatedSelectedId.set(null);
    this.missionCreateMode.set(sub.missionMode === 'automatic' ? 'automatic' : 'manual');
    this.missionAdding.set(this.buildGeneratedMissions(sub).length === 0);
  }

  closeMissionPicker(): void {
    this.missionPickerTarget.set(null);
    this.generatedSelectedId.set(null);
    this.missionAdding.set(false);
  }

  openManeuverPicker(phaseKey: string, subKey: string): void {
    if (this.isReadOnly()) return;
    const sub = this.phases()
      .find((item) => item.key === phaseKey)
      ?.subphases.find((item) => item.key === subKey);
    if (!sub) return;
    this.maneuverPickerTarget.set({ phaseKey, subKey });
    this.maneuverPickerMode.set('add');
    this.maneuverPickerView.set('catalog');
    this.applySubphaseManeuvers(sub);
    this.maneuverSearch.setValue('');
    this.maneuverQuery.set('');
  }

  closeManeuverPicker(): void {
    this.maneuverPickerTarget.set(null);
    this.maneuverPickerMode.set('add');
    this.maneuverCheckedIds.set([]);
    this.maneuverPickerView.set('catalog');
    this.maneuverOperationOrder.set([]);
    this.maneuverBoardOrder.set([]);
    this.maneuverAssignment.set({});
  }

  addManeuverFromCatalog(maneuverId: string): void {
    const target = this.maneuverPickerTarget();
    const sub = this.currentManeuverSub();
    if (!target || !sub || sub.maneuverIds.includes(maneuverId)) return;
    this.toggleManeuver(target.phaseKey, target.subKey, maneuverId, true);
    if (!this.maneuverCheckedIds().includes(maneuverId)) {
      this.maneuverCheckedIds.update((ids) => [...ids, maneuverId]);
    }
  }

  showManeuverGroups(): void {
    if (!this.canGroupManeuvers() || this.maneuverPickerMode() === 'order') return;
    const existing = this.currentManeuverSub()?.maneuverIds ?? [];
    const merged = [...new Set([...existing, ...this.maneuverCheckedIds()])];
    this.maneuverCheckedIds.set(merged);
    this.maneuverBoardOrder.set(this.mergeManeuverOrder(this.maneuverBoardOrder(), merged));
    this.maneuverAssignment.set(this.filterManeuverAssignment(this.maneuverAssignment(), merged));
    this.maneuverPickerView.set('grouped');
    this.syncManeuversFromBoard();
  }

  showManeuverOrder(phaseKey: string, subKey: string): void {
    if (this.isReadOnly()) return;
    const sub = this.phases()
      .find((item) => item.key === phaseKey)
      ?.subphases.find((item) => item.key === subKey);
    if (!sub?.maneuverIds.length) return;
    this.maneuverPickerTarget.set({ phaseKey, subKey });
    this.maneuverPickerMode.set('order');
    this.applySubphaseManeuvers(sub);
    this.maneuverPickerView.set('grouped');
  }

  onOperationOrder(ids: string[]): void {
    if (this.maneuverPickerMode() === 'order') return;
    this.maneuverOperationOrder.set(ids);
    this.syncManeuversFromBoard();
  }

  onManeuverBoardOrder(ids: string[]): void {
    if (this.maneuverPickerMode() === 'order') return;
    this.maneuverBoardOrder.set(ids);
    this.syncManeuversFromBoard();
  }

  onManeuverAssignment(next: Record<string, string>): void {
    if (this.maneuverPickerMode() === 'order') return;
    this.maneuverAssignment.set(next);
    this.syncManeuversFromBoard();
  }

  removeBoardManeuver(maneuverId: string): void {
    this.maneuverCheckedIds.update((ids) => ids.filter((id) => id !== maneuverId));
    this.maneuverBoardOrder.update((ids) => ids.filter((id) => id !== maneuverId));
    const next = { ...this.maneuverAssignment() };
    delete next[maneuverId];
    this.maneuverAssignment.set(next);
    this.syncManeuversFromBoard();
  }

  private syncManeuversFromBoard(): void {
    const target = this.maneuverPickerTarget();
    if (!target || this.maneuverPickerMode() === 'order') return;
    const items = this.maneuverBoardOrder().length ? this.maneuverBoardOrder() : this.maneuverCheckedIds();
    const assignment = this.maneuverAssignment();
    const queued: string[] = [];
    for (const operationId of this.maneuverOperationOrder()) {
      for (const id of items) {
        if (assignment[id] === operationId) queued.push(id);
      }
    }
    for (const id of items) {
      if (!assignment[id]) queued.push(id);
    }
    this.setSubphaseManeuverState(target.phaseKey, target.subKey, queued, this.maneuverOperationOrder(), assignment);
  }

  private applySubphaseManeuvers(sub: StudioSubphase): void {
    this.maneuverCheckedIds.set([...sub.maneuverIds]);
    this.maneuverBoardOrder.set([...sub.maneuverIds]);
    this.maneuverOperationOrder.set([...sub.maneuverOperationIds]);
    this.maneuverAssignment.set({ ...sub.maneuverAssignment });
  }

  private mergeManeuverOrder(current: readonly string[], next: readonly string[]): string[] {
    const wanted = new Set(next);
    const kept = current.filter((id) => wanted.has(id));
    const seen = new Set(kept);
    return [...kept, ...next.filter((id) => !seen.has(id))];
  }

  private filterManeuverAssignment(
    assignment: Record<string, string>,
    maneuverIds: readonly string[],
  ): Record<string, string> {
    const wanted = new Set(maneuverIds);
    const next: Record<string, string> = {};
    for (const [maneuverId, operationId] of Object.entries(assignment)) {
      if (wanted.has(maneuverId)) next[maneuverId] = operationId;
    }
    return next;
  }

  private setSubphaseManeuverState(
    phaseKey: string,
    subKey: string,
    ids: string[],
    operationIds: readonly string[],
    assignment: Record<string, string>,
  ): void {
    const unique = [...new Set(ids.filter(Boolean))];
    const ops = [...new Set(operationIds.filter(Boolean))];
    this.patchSubphase(phaseKey, subKey, {
      maneuverIds: unique,
      maneuverOperationIds: ops,
      maneuverAssignment: this.filterManeuverAssignment(assignment, unique),
    });
  }

  onManeuverCrumb(action: string): void {
    if (action === 'catalog' && this.maneuverPickerMode() === 'add') {
      this.maneuverPickerView.set('catalog');
    }
  }

  private toManeuverRows(items: ManeuverBankEntity[]): UiTableRow[] {
    const assigned = new Set(this.currentManeuverSub()?.maneuverIds ?? []);
    return items.map((item) => ({
      id: item.id,
      actionDisabled: assigned.has(item.id),
      cells: {
        code: item.code,
        name: item.name,
        description: item.description || '—',
        use: assigned.has(item.id) ? 'En la subfase' : 'Catálogo',
      },
    }));
  }

  startAddingMissions(): void {
    this.missionAdding.set(true);
    this.missionCreateMode.set('manual');
  }

  setMissionCreateMode(mode: string): void {
    if (mode === 'automatic') {
      this.createMissionsAutomatic();
      return;
    }
    this.createMissionsManual();
  }

  createMissionsManual(): void {
    const target = this.missionPickerTarget();
    if (!target) return;
    this.missionCreateMode.set('manual');
    this.promoteSeriesToCustom(target.phaseKey, target.subKey);
    this.setMissionMode(target.phaseKey, target.subKey, 'manual');
  }

  createMissionsAutomatic(): void {
    const target = this.missionPickerTarget();
    if (!target) return;
    this.missionCreateMode.set('automatic');
  }

  addAutomaticSeries(): void {
    const target = this.missionPickerTarget();
    const sub = this.currentPickerSub();
    if (!target || !sub) return;
    const generated = expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0);
    if (!generated.length) return;
    this.patchSubphase(target.phaseKey, target.subKey, {
      missionMode: 'automatic',
      missionTypeIds: [],
      customMissionNames: [],
    });
    this.missionAdding.set(false);
  }

  removeGeneratedMission(): void {
    const target = this.missionPickerTarget();
    const key = this.generatedSelectedId();
    const item = this.generatedMissions().find((row) => row.key === key);
    if (!target || !item) return;
    if (item.kind === 'catalog') {
      const ids = (this.currentPickerSub()?.missionTypeIds ?? []).filter((id) => id !== item.value);
      this.patchSubphase(target.phaseKey, target.subKey, { missionTypeIds: ids });
    } else if (item.kind === 'custom') {
      this.removeCustomMission(target.phaseKey, target.subKey, item.value);
    } else {
      const remaining = this.generatedMissions()
        .filter((row) => row.kind === 'series' && row.value !== item.value)
        .map((row) => row.label);
      this.patchSubphase(target.phaseKey, target.subKey, {
        missionMode: 'manual',
        customMissionNames: remaining,
        autoMissionCode: '',
        autoMissionCount: 0,
      });
    }
    this.generatedSelectedId.set(null);
  }

  pickPhaseBank(phaseBankId: string): void {
    const key = this.phaseBankPickerKey();
    if (!key || this.isReadOnly()) return;
    const currentId = this.currentPickerBankId();
    if (phaseBankId !== currentId && this.usedPhaseBankIds().has(phaseBankId)) return;
    this.phases.update((items) => items.map((item) => (item.key === key ? { ...item, phaseBankId } : item)));
    this.closePhaseBankPicker();
  }

  addPhase(kind: ProgramModuleKind = this.architectureKind()): void {
    const phaseBankId = this.nextAvailablePhaseBankIdFor(kind);
    if (!phaseBankId || this.isReadOnly()) return;
    const defaultSub =
      this.subphaseBanks().find((item) => item.status === 'active' && defaultSubphaseModuleKind(item) === kind)?.id ??
      '';
    this.phases.update((items) => [
      ...items,
      {
        key: `draft-ph-${this.draftSeq++}`,
        phaseBankId,
        moduleKind: kind,
        subphases: kind === 'ground' ? [] : defaultSub ? [this.emptySubphase(defaultSub)] : [],
      },
    ]);
  }

  removePhase(key: string): void {
    if (this.isReadOnly()) return;
    this.phases.update((items) => items.filter((item) => item.key !== key));
  }

  canMovePhase(key: string, delta: number): boolean {
    const items = this.phases();
    const index = items.findIndex((item) => item.key === key);
    if (index < 0) return false;
    const kind = items[index].moduleKind;
    let target = index + delta;
    while (target >= 0 && target < items.length && items[target].moduleKind !== kind) {
      target += delta;
    }
    return target >= 0 && target < items.length;
  }

  movePhase(key: string, delta: number): void {
    if (this.isReadOnly() || !this.canMovePhase(key, delta)) return;
    this.phases.update((items) => {
      const index = items.findIndex((item) => item.key === key);
      if (index < 0) return items;
      const kind = items[index].moduleKind;
      let target = index + delta;
      while (target >= 0 && target < items.length && items[target].moduleKind !== kind) {
        target += delta;
      }
      if (target < 0 || target >= items.length) return items;
      const copy = [...items];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  setNextSubphase(phaseKey: string, value: string): void {
    this.nextSubphaseBankId.update((map) => ({ ...map, [phaseKey]: value }));
  }

  addSubphase(phaseKey: string): void {
    if (this.isReadOnly()) return;
    const phase = this.phases().find((item) => item.key === phaseKey);
    if (phase?.moduleKind === 'ground') {
      this.addGroundSubject(phaseKey);
      return;
    }
    const kind = phase?.moduleKind ?? this.architectureKind();
    const bankId =
      this.nextSubphaseBankId()[phaseKey] || this.subphaseBankOptionsFor(kind)[0]?.value || '';
    if (!bankId) return;
    this.phases.update((items) =>
      items.map((item) =>
        item.key === phaseKey
          ? {
              ...item,
              subphases: [...item.subphases, this.emptySubphase(bankId)],
            }
          : item,
      ),
    );
  }

  addGroundSubject(phaseKey: string): void {
    if (this.isReadOnly()) return;
    const draft = this.groundSubjectDraft(phaseKey);
    const name = draft.name.trim();
    if (!name) return;
    const hours = Number.isFinite(draft.hours) ? draft.hours : 1;
    const coefficient = Number.isFinite(draft.coefficient) ? draft.coefficient : 0;
    const minPassingGrade = Number.isFinite(draft.minPassingGrade) ? draft.minPassingGrade : 16;
    const codeBase = academicCodeFromName(name);
    const used = new Set(this.subphaseBanks().map((item) => item.code));
    let code = codeBase;
    let suffix = 2;
    while (used.has(code)) {
      code = `${codeBase.slice(0, 10)}${suffix}`.slice(0, 16);
      suffix += 1;
    }
    const bank: SubphaseBankEntity = {
      id: `draft-sb-${this.draftSeq++}`,
      code,
      name,
      description: '',
      status: 'active',
      coefficient,
      minPassingGrade,
    };
    this.subphaseBanks.update((items) => [...items, bank]);
    this.phases.update((items) =>
      items.map((item) =>
        item.key === phaseKey
          ? { ...item, subphases: [...item.subphases, this.emptySubphase(bank.id, hours)] }
          : item,
      ),
    );
    this.draftGroundSubjects.update((map) => ({ ...map, [phaseKey]: { ...EMPTY_GROUND_SUBJECT_DRAFT } }));
    this.groundSubjectNameField(phaseKey);
    this.groundSubjectHoursField(phaseKey);
    this.groundSubjectCoefField(phaseKey);
    this.groundSubjectMinField(phaseKey);
  }

  groundSubjectDraft(phaseKey: string): GroundSubjectDraft {
    return this.draftGroundSubjects()[phaseKey] ?? EMPTY_GROUND_SUBJECT_DRAFT;
  }

  groundSubjectNameField(phaseKey: string): FormControl<string> {
    return this.textField(`gs-name:${phaseKey}`, this.groundSubjectDraft(phaseKey).name, (name) => {
      this.patchGroundSubjectDraft(phaseKey, { name });
    });
  }

  groundSubjectHoursField(phaseKey: string): FormControl<number> {
    return this.numberField(`gs-hours:${phaseKey}`, this.groundSubjectDraft(phaseKey).hours, (hours) => {
      this.patchGroundSubjectDraft(phaseKey, { hours });
    });
  }

  groundSubjectCoefField(phaseKey: string): FormControl<number> {
    return this.numberField(
      `gs-coef:${phaseKey}`,
      this.groundSubjectDraft(phaseKey).coefficient,
      (coefficient) => {
        this.patchGroundSubjectDraft(phaseKey, { coefficient });
      },
    );
  }

  groundSubjectMinField(phaseKey: string): FormControl<number> {
    return this.numberField(
      `gs-min:${phaseKey}`,
      this.groundSubjectDraft(phaseKey).minPassingGrade,
      (minPassingGrade) => {
        this.patchGroundSubjectDraft(phaseKey, { minPassingGrade });
      },
    );
  }

  addPeriodicExam(): void {
    if (this.isReadOnly()) return;
    const draft = this.draftPeriodicExam();
    const period = draft.period.trim();
    const exam = draft.exam.trim();
    if (!period || !exam) return;
    const neiWeight = Number.isFinite(draft.neiWeight) ? draft.neiWeight : 0;
    const countsTowardNei = neiWeight > 0;
    this.periodicExams.update((items) => [
      ...items,
      {
        id: `periodic-${this.draftSeq++}`,
        period,
        exam,
        kind: periodicExamKindFromPeriod(period),
        minPassingGrade: Number.isFinite(draft.minPassingGrade) ? draft.minPassingGrade : 16,
        countsTowardNei,
        neiWeight: countsTowardNei ? neiWeight : 0,
      },
    ]);
    this.draftPeriodicExam.set({ ...EMPTY_GROUND_PERIODIC_DRAFT });
    this.periodicPeriodField();
    this.periodicExamNameField();
    this.periodicMinField();
    this.periodicWeightField();
  }

  removePeriodicExam(id: string): void {
    if (this.isReadOnly()) return;
    this.periodicExams.update((items) => items.filter((item) => item.id !== id));
  }

  periodicPeriodField(): FormControl<string> {
    return this.textField('periodic-period', this.draftPeriodicExam().period, (period) => {
      this.draftPeriodicExam.update((current) => ({ ...current, period }));
    });
  }

  periodicExamNameField(): FormControl<string> {
    return this.textField('periodic-exam', this.draftPeriodicExam().exam, (exam) => {
      this.draftPeriodicExam.update((current) => ({ ...current, exam }));
    });
  }

  periodicMinField(): FormControl<number> {
    return this.numberField('periodic-min', this.draftPeriodicExam().minPassingGrade, (minPassingGrade) => {
      this.draftPeriodicExam.update((current) => ({ ...current, minPassingGrade }));
    });
  }

  periodicWeightField(): FormControl<number> {
    return this.numberField('periodic-weight', this.draftPeriodicExam().neiWeight, (neiWeight) => {
      this.draftPeriodicExam.update((current) => ({ ...current, neiWeight }));
    });
  }

  private patchGroundSubjectDraft(phaseKey: string, patch: Partial<GroundSubjectDraft>): void {
    this.draftGroundSubjects.update((map) => ({
      ...map,
      [phaseKey]: { ...this.groundSubjectDraft(phaseKey), ...patch },
    }));
  }

  removeSubphase(phaseKey: string, subKey: string): void {
    if (this.isReadOnly()) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key === phaseKey
          ? { ...phase, subphases: phase.subphases.filter((item) => item.key !== subKey) }
          : phase,
      ),
    );
  }

  hoursField(phaseKey: string, subKey: string, hours: number): FormControl<number> {
    return this.numberField(`hours:${phaseKey}:${subKey}`, hours, (value) => {
      this.patchSubphase(phaseKey, subKey, { hours: Number.isFinite(value) ? value : 0 });
    });
  }

  nameField(subKey: string, value: string): FormControl<string> {
    return this.textField(`name:${subKey}`, value, (next) => {
      this.draftMissionName.update((map) => ({ ...map, [subKey]: next }));
    });
  }

  codeField(phaseKey: string, subKey: string, value: string): FormControl<string> {
    return this.textField(`code:${phaseKey}:${subKey}`, value, (next) => {
      this.patchSubphase(phaseKey, subKey, { autoMissionCode: next });
    });
  }

  countField(phaseKey: string, subKey: string, count: number): FormControl<number> {
    return this.numberField(`count:${phaseKey}:${subKey}`, count, (value) => {
      const raw = Number(value);
      const next = Number.isFinite(raw)
        ? Math.min(AUTO_MISSION_COUNT_MAX, Math.max(0, Math.trunc(raw)))
        : 0;
      this.patchSubphase(phaseKey, subKey, { autoMissionCount: next });
    });
  }

  setMissionMode(phaseKey: string, subKey: string, value: string): void {
    if (value !== 'manual' && value !== 'automatic') return;
    this.patchSubphase(phaseKey, subKey, { missionMode: value });
  }

  addCustomMission(phaseKey: string, subKey: string): void {
    const name = (this.draftMissionName()[subKey] ?? '').trim();
    if (!name || this.isReadOnly()) return;
    this.promoteSeriesToCustom(phaseKey, subKey);
    this.setMissionMode(phaseKey, subKey, 'manual');
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey || sub.customMissionNames.some((item) => item.toLowerCase() === name.toLowerCase())
                  ? sub
                  : { ...sub, customMissionNames: [...sub.customMissionNames, name] },
              ),
            },
      ),
    );
    this.draftMissionName.update((map) => ({ ...map, [subKey]: '' }));
    this.nameField(subKey, '');
    this.missionAdding.set(false);
  }

  removeCustomMission(phaseKey: string, subKey: string, name: string): void {
    this.patchSubphase(phaseKey, subKey, {
      customMissionNames: this.phases()
        .flatMap((phase) => phase.subphases)
        .find((sub) => sub.key === subKey)
        ?.customMissionNames.filter((item) => item !== name) ?? [],
    });
  }

  removeMission(phaseKey: string, subKey: string, name: string): void {
    const sub = this.phases()
      .flatMap((phase) => phase.subphases)
      .find((item) => item.key === subKey);
    if (!sub) return;
    if (sub.missionMode === 'automatic') {
      const remaining = expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0).filter(
        (item) => item !== name,
      );
      this.patchSubphase(phaseKey, subKey, {
        missionMode: 'manual',
        customMissionNames: remaining,
        autoMissionCode: '',
        autoMissionCount: 0,
      });
      return;
    }
    if (sub.customMissionNames.includes(name)) {
      this.removeCustomMission(phaseKey, subKey, name);
      return;
    }
    const mission = this.missions().find((item) => `${item.code} · ${item.name}` === name);
    if (mission) {
      this.toggleMission(phaseKey, subKey, mission.id, false);
    }
  }

  autoPreview(sub: StudioSubphase): string {
    const items = expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0);
    if (!items.length) return 'Ejemplo: CER y 17 generan C1, C2, C3 … C17.';
    if (items.length <= 8) return items.join(', ');
    return `${items.slice(0, 4).join(', ')} … ${items[items.length - 1]}`;
  }

  missionLabels(sub: StudioSubphase): string[] {
    if (sub.missionMode === 'automatic') {
      return expandAutoMissions(sub.autoMissionCode, sub.autoMissionCount);
    }
    const fromCatalog = sub.missionTypeIds.map((id) => {
      const mission = this.missions().find((item) => item.id === id);
      return mission ? `${mission.code} · ${mission.name}` : id;
    });
    return [...fromCatalog, ...sub.customMissionNames];
  }

  maneuverLabels(sub: StudioSubphase): string[] {
    return sub.maneuverIds.map((id) => {
      const maneuver = this.maneuvers().find((item) => item.id === id);
      return maneuver ? `${maneuver.code} · ${maneuver.name}` : id;
    });
  }

  missionCountLabel(sub: StudioSubphase): string {
    const count = this.missionLabels(sub).length;
    if (!count) return 'Ninguna';
    return count === 1 ? '1 misión' : `${count} misiones`;
  }

  maneuverCountLabel(sub: StudioSubphase): string {
    const count = sub.maneuverIds.length;
    if (!count) return 'Ninguna';
    return count === 1 ? '1 maniobra' : `${count} maniobras`;
  }

  removeManeuver(phaseKey: string, subKey: string, name: string): void {
    const maneuver = this.maneuvers().find((item) => `${item.code} · ${item.name}` === name);
    if (maneuver) this.toggleManeuver(phaseKey, subKey, maneuver.id, false);
  }

  toggleMission(phaseKey: string, subKey: string, missionId: string, checked: boolean): void {
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey
                  ? sub
                  : {
                      ...sub,
                      missionTypeIds: checked
                        ? [...sub.missionTypeIds, missionId]
                        : sub.missionTypeIds.filter((id) => id !== missionId),
                    },
              ),
            },
      ),
    );
  }

  toggleManeuver(phaseKey: string, subKey: string, maneuverId: string, checked: boolean): void {
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey
                  ? sub
                  : {
                      ...sub,
                      maneuverIds: checked
                        ? [...sub.maneuverIds, maneuverId]
                        : sub.maneuverIds.filter((id) => id !== maneuverId),
                      maneuverAssignment: checked
                        ? sub.maneuverAssignment
                        : this.filterManeuverAssignment(sub.maneuverAssignment, sub.maneuverIds.filter((id) => id !== maneuverId)),
                    },
              ),
            },
      ),
    );
  }

  private textField(key: string, value: string, apply: (value: string) => void): FormControl<string> {
    const existing = this.fieldControls.get(key);
    if (existing instanceof FormControl) {
      const control = existing as FormControl<string>;
      if (control.value !== value) control.setValue(value, { emitEvent: false });
      return control;
    }
    const control = new FormControl(value, { nonNullable: true });
    control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(apply);
    this.fieldControls.set(key, control);
    return control;
  }

  private numberField(key: string, value: number, apply: (value: number) => void): FormControl<number> {
    const existing = this.fieldControls.get(key);
    if (existing instanceof FormControl) {
      const control = existing as FormControl<number>;
      if (Number(control.value) !== value) control.setValue(value, { emitEvent: false });
      return control;
    }
    const control = new FormControl(value, { nonNullable: true });
    control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((next) => apply(Number(next)));
    this.fieldControls.set(key, control);
    return control;
  }

  private buildGeneratedMissions(sub: StudioSubphase | null): GeneratedMission[] {
    if (!sub) return [];
    if (sub.missionMode === 'automatic') {
      return expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0).map((label) => ({
        key: `series:${label}`,
        label,
        kind: 'series',
        origin: 'Automático',
        value: label,
      }));
    }
    const catalog = sub.missionTypeIds.map((id) => {
      const mission = this.missions().find((item) => item.id === id);
      return {
        key: `catalog:${id}`,
        label: mission ? `${mission.code} · ${mission.name}` : id,
        kind: 'catalog' as const,
        origin: 'Manual',
        value: id,
      };
    });
    const custom = sub.customMissionNames.map((name) => ({
      key: `custom:${name}`,
      label: name,
      kind: 'custom' as const,
      origin: 'Manual',
      value: name,
    }));
    return [...catalog, ...custom];
  }

  private emptySubphase(subphaseBankId: string, hours = 2): StudioSubphase {
    return {
      key: `draft-sp-${this.draftSeq++}`,
      subphaseBankId,
      hours,
      missionMode: 'manual',
      missionTypeIds: [],
      customMissionNames: [],
      autoMissionCode: '',
      autoMissionCount: 0,
      maneuverIds: [],
      maneuverOperationIds: [],
      maneuverAssignment: {},
      standardAssignments: [],
    };
  }

  private toMatrixSubphaseView(phase: StudioPhase, sub: StudioSubphase): ProgramStandardSubphaseView {
    const missions = this.toMissionViews(sub);
    const maneuvers = this.toManeuverViews(sub);
    const totalCells = missions.length * maneuvers.length;
    const configuredCells = sub.standardAssignments.filter((item) => item.dirbeLevel).length;
    return {
      id: sub.key,
      phaseId: phase.key,
      code: this.subphaseBanks().find((item) => item.id === sub.subphaseBankId)?.code ?? '',
      name: this.subphaseBanks().find((item) => item.id === sub.subphaseBankId)?.name ?? 'Subfase',
      label: this.subphaseName(sub.subphaseBankId),
      hours: sub.hours,
      missions,
      maneuvers,
      configuredCells,
      totalCells,
      levelsUsed: new Set(sub.standardAssignments.map((item) => item.dirbeLevel).filter(Boolean)).size,
      percentage: totalCells ? Math.round((configuredCells / totalCells) * 100) : 0,
      hasMatrix: missions.length > 0 && maneuvers.length > 0,
      matrixHint: this.copy.matrixPick,
    };
  }

  private toMissionViews(sub: StudioSubphase): ProgramStandardMissionView[] {
    return curriculumMissionRefs(sub).map((mission, index) => {
      if (mission.kind === 'catalog') {
        const catalog = this.missions().find((item) => item.id === mission.value);
        return {
          key: mission.key,
          typeCode: catalog?.code ?? 'CAT',
          code: catalog?.code ?? `M${index + 1}`,
          name: catalog?.name ?? 'Misión',
          label: catalog ? `${catalog.code} · ${catalog.name}` : mission.value,
          detail: catalog?.description || '',
          kindLabel: 'Catálogo',
        };
      }
      if (mission.kind === 'automatic') {
        return {
          key: mission.key,
          typeCode: sub.autoMissionCode || 'SER',
          code: mission.value,
          name: mission.value,
          label: mission.value,
          detail: '',
          kindLabel: 'Serie',
        };
      }
      return {
        key: mission.key,
        typeCode: 'MAN',
        code: `M${index + 1}`,
        name: mission.value,
        label: mission.value,
        detail: '',
        kindLabel: 'Propia',
      };
    });
  }

  private toManeuverViews(sub: StudioSubphase): ProgramStandardManeuverView[] {
    return sub.maneuverIds.map((id) => {
      const maneuver = this.maneuvers().find((item) => item.id === id);
      const operationId = sub.maneuverAssignment[id] || maneuver?.operationId || '';
      const operation = this.operations().find((item) => item.id === operationId);
      return {
        id,
        code: maneuver?.code ?? id,
        name: maneuver?.name ?? id,
        description: maneuver?.description ?? '',
        operationId,
        operationName: operation?.name ?? '',
      };
    });
  }

  private promoteSeriesToCustom(phaseKey: string, subKey: string): void {
    const sub = this.phases()
      .find((item) => item.key === phaseKey)
      ?.subphases.find((item) => item.key === subKey);
    if (!sub || sub.missionMode !== 'automatic') return;
    const series = expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0);
    const names = [...sub.customMissionNames];
    for (const label of series) {
      if (!names.some((item) => item.toLowerCase() === label.toLowerCase())) names.push(label);
    }
    this.patchSubphase(phaseKey, subKey, {
      missionMode: 'manual',
      customMissionNames: names,
      autoMissionCode: '',
      autoMissionCount: 0,
    });
  }

  private patchSubphase(phaseKey: string, subKey: string, patch: Partial<StudioSubphase>): void {
    if (this.isReadOnly()) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) => (sub.key === subKey ? { ...sub, ...patch } : sub)),
            },
      ),
    );
  }

  async save(): Promise<void> {
    if (this.isReadOnly() || this.saving()) return;
    this.form.markAllAsTouched();
    const invalid = this.firstInvalidStep();
    if (invalid) {
      if (invalid === 'architecture') {
        const incomplete = (['ground', 'air', 'simulator'] as const).find(
          (kind) => this.enabledModules()[kind] && !this.phasesOf(kind).some((phase) => phase.subphases.length > 0),
        );
        if (incomplete) this.selectModule(incomplete);
      }
      if (invalid === 'matrix') {
        const flight = (['air', 'simulator'] as const).find((kind) => this.enabledModules()[kind]);
        this.selectModule(flight ?? 'air');
      }
      this.error.set(this.gateMessage(invalid));
      this.stepError.set(this.gateMessage(invalid));
      this.step.set(invalid);
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    this.creating.set(true);
    try {
      await this.ensureDraftSubjectBanks();
      const enabled = this.enabledModules();
      const phases: PhaseDraftInput[] = this.phases()
        .filter((phase) => enabled[phase.moduleKind])
        .map((phase, index) => ({
          phaseBankId: phase.phaseBankId,
          moduleKind: phase.moduleKind,
          sortOrder: index + 1,
          subphases: phase.subphases.map((sub, subIndex) => ({
            subphaseBankId: sub.subphaseBankId,
            hours: sub.hours,
            missionMode: sub.missionMode,
            missionTypeIds: sub.missionTypeIds,
            customMissionNames: sub.customMissionNames,
            autoMissionCode: sub.autoMissionCode,
            autoMissionCount: sub.autoMissionCount,
            maneuverIds: sub.maneuverIds,
            maneuverOperationIds: sub.maneuverOperationIds,
            maneuverAssignment: sub.maneuverAssignment,
            standardAssignments: sub.standardAssignments,
            sortOrder: subIndex + 1,
          })),
        }));
      await Promise.all([
        firstValueFrom(
          this.saveCurriculum.execute({
            id: this.editingId ?? undefined,
            program: {
              ...this.form.getRawValue(),
              groundPeriodicExams: this.periodicExams(),
              academicYear: this.academicYear() ?? undefined,
              lifecycleFlag: this.lifecycleFlag(),
            },
            phases,
          }),
        ),
        holdFor(CATALOG_CREATE_HOLD_MS),
      ]);
      if (this.left) return;
      this.toast.success(
        this.isCreate ? 'Programa creado' : 'Programa guardado',
        'El programa ya está en la academia.',
      );
      await this.router.navigateByUrl(this.listHref);
    } catch (err) {
      if (this.left) return;
      this.creating.set(false);
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar el programa.');
    } finally {
      if (!this.left) this.saving.set(false);
    }
  }

  private async ensureDraftSubjectBanks(): Promise<void> {
    const drafts = this.subphaseBanks().filter((item) => item.id.startsWith('draft-sb-'));
    if (!drafts.length) return;
    const mapped = new Map<string, string>();
    for (const draft of drafts) {
      const created = await firstValueFrom(
        this.createSubphaseBank.execute({
          code: draft.code,
          name: draft.name,
          description: draft.description,
          status: draft.status,
          coefficient: draft.coefficient,
          minPassingGrade: draft.minPassingGrade,
        }),
      );
      mapped.set(draft.id, created.id);
    }
    this.subphaseBanks.update((items) =>
      items.map((item) => (mapped.has(item.id) ? { ...item, id: mapped.get(item.id) ?? item.id } : item)),
    );
    this.phases.update((items) =>
      items.map((phase) => ({
        ...phase,
        subphases: phase.subphases.map((sub) => ({
          ...sub,
          subphaseBankId: mapped.get(sub.subphaseBankId) ?? sub.subphaseBankId,
        })),
      })),
    );
  }
}
