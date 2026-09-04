import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  ListManeuvers,
  ListMissionTypes,
  ListOperations,
  ListPhaseBanks,
  ListPhases,
  ListPrograms,
  ListSubphaseBanks,
  ListSubphases,
  SaveProgramStandardMatrix,
} from '@core/application';
import type {
  DirbeLevel,
  ManeuverBankEntity,
  ManeuverStandardAssignment,
  MissionTypeEntity,
  OperationEntity,
  PhaseBankEntity,
  PhaseEntity,
  ProgramEntity,
  SubphaseBankEntity,
  SubphaseEntity,
} from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { curriculumMissionRefs } from '@core/domain/services/admin-catalog';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { ProgramStandardNavigator } from '../../components/program-standard-navigator/program-standard-navigator';
import { StandardAssignmentWorkspace } from '../../components/standard-assignment-workspace/standard-assignment-workspace';
import {
  programStandardCellKey,
  standardCellKey,
  type ProgramStandardAssignmentTarget,
  type ProgramStandardDirbeChange,
  type ProgramStandardManeuverView,
  type ProgramStandardMissionView,
  type ProgramStandardPhaseView,
  type ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';

interface ProgramStandardCellAssignment extends ProgramStandardAssignmentTarget {
  standardIds: string[];
  dirbeLevel: DirbeLevel | null;
}

interface ProgramStandardSubphaseBase {
  id: string;
  phaseId: string;
  code: string;
  name: string;
  label: string;
  hours: number;
  missions: ProgramStandardMissionView[];
  maneuvers: ProgramStandardManeuverView[];
}

interface ProgramStandardPhaseBase {
  id: string;
  code: string;
  name: string;
  label: string;
  subphases: ProgramStandardSubphaseBase[];
}

@Component({
  selector: 'app-program-standards-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Icon, ProgramStandardNavigator, StandardAssignmentWorkspace, UiLoading],
  templateUrl: './program-standards.page.html',
  styleUrl: './program-standards.page.scss',
})
export class ProgramStandardsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);
  private readonly listMissionTypes = inject(ListMissionTypes);
  private readonly listOperations = inject(ListOperations);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly saveStandardMatrix = inject(SaveProgramStandardMatrix);
  private readonly toast = inject(ToastService);
  private left = false;

  readonly programId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly listHref = '/catalogo/programas';
  readonly editProgramHref = `/catalogo/programas/${this.programId}/editar`;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly savingSubphaseId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly program = signal<ProgramEntity | null>(null);
  readonly basePhases = signal<ProgramStandardPhaseBase[]>([]);
  readonly assignments = signal<ProgramStandardCellAssignment[]>([]);
  readonly initialSubphaseMatrices = signal<Record<string, string>>({});
  readonly activePhaseId = signal<string | null>(null);
  readonly activeSubphaseId = signal<string | null>(null);

  readonly title = computed(() => {
    const name = this.program()?.name;
    return name ? `Estándares de ${name}` : 'Configurar estándares';
  });

  readonly phases = computed<ProgramStandardPhaseView[]>(() => {
    const assignments = this.assignments();
    return this.basePhases().map((phase) => {
      const subphases = phase.subphases.map((subphase) => this.toSubphaseView(subphase, assignments));
      const configuredCells = subphases.reduce((sum, subphase) => sum + subphase.configuredCells, 0);
      const totalCells = subphases.reduce((sum, subphase) => sum + subphase.totalCells, 0);
      const levelsUsed = new Set(
        assignments
          .filter((assignment) => subphases.some((subphase) => subphase.id === assignment.subphaseId))
          .map((assignment) => assignment.dirbeLevel)
          .filter((level): level is DirbeLevel => Boolean(level)),
      ).size;
      return {
        ...phase,
        subphases,
        configuredCells,
        totalCells,
        levelsUsed,
        percentage: totalCells ? Math.round((configuredCells / totalCells) * 100) : 0,
      };
    });
  });

  readonly activePhase = computed(
    () => this.phases().find((phase) => phase.id === this.activePhaseId()) ?? null,
  );

  readonly activeSubphase = computed(() => {
    const id = this.activeSubphaseId();
    if (!id) return null;
    for (const phase of this.phases()) {
      const subphase = phase.subphases.find((item) => item.id === id);
      if (subphase) return subphase;
    }
    return null;
  });

  readonly activeAssignmentMap = computed<Readonly<Record<string, DirbeLevel | null>>>(() => {
    const subphaseId = this.activeSubphaseId();
    if (!subphaseId) return {};
    const map: Record<string, DirbeLevel | null> = {};
    for (const assignment of this.assignments()) {
      if (assignment.subphaseId !== subphaseId) continue;
      map[standardCellKey(assignment.missionKey, assignment.maneuverId)] = assignment.dirbeLevel;
    }
    return map;
  });

  readonly dirtySubphaseIds = computed<ReadonlySet<string>>(() => {
    const initial = this.initialSubphaseMatrices();
    const assignments = this.assignments();
    const dirty = new Set<string>();
    for (const subphase of this.basePhases().flatMap((phase) => phase.subphases)) {
      if (this.subphaseSnapshot(subphase.id, assignments) !== (initial[subphase.id] ?? '[]')) {
        dirty.add(subphase.id);
      }
    }
    return dirty;
  });

  readonly activeSubphaseDirty = computed(() => {
    const id = this.activeSubphaseId();
    return Boolean(id && this.dirtySubphaseIds().has(id));
  });
  readonly activeSubphaseSaving = computed(() => this.savingSubphaseId() === this.activeSubphaseId());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });

    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
      phaseBanks: this.listPhaseBanks.execute(),
      subphaseBanks: this.listSubphaseBanks.execute(),
      missionTypes: this.listMissionTypes.execute(),
      operations: this.listOperations.execute(),
      maneuvers: this.listManeuvers.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.hydrate(data),
        error: () => this.loadState.set('error'),
      });
  }

  selectPhase(phaseId: string): void {
    if (this.activePhaseId() === phaseId) {
      this.activePhaseId.set(null);
      this.activeSubphaseId.set(null);
      return;
    }
    this.activePhaseId.set(phaseId);
    const activeSubphase = this.activeSubphase();
    if (activeSubphase?.phaseId !== phaseId) {
      this.activeSubphaseId.set(null);
    }
  }

  selectSubphase(subphaseId: string): void {
    const phase = this.phases().find((item) => item.subphases.some((subphase) => subphase.id === subphaseId));
    const subphase = phase?.subphases.find((item) => item.id === subphaseId);
    if (!phase || !subphase) return;
    this.activePhaseId.set(phase.id);
    this.activeSubphaseId.set(subphase.id);
    this.error.set(null);
  }

  updateDirbeLevel(change: ProgramStandardDirbeChange): void {
    const subphase = this.basePhases()
      .flatMap((phase) => phase.subphases)
      .find((item) => item.id === change.subphaseId);
    if (!subphase) return;
    if (!subphase.missions.some((mission) => mission.key === change.missionKey)) return;
    if (!subphase.maneuvers.some((maneuver) => maneuver.id === change.maneuverId)) return;

    const targetKey = programStandardCellKey(change);
    this.assignments.update((current) => {
      const index = current.findIndex((assignment) => programStandardCellKey(assignment) === targetKey);
      const existing = index >= 0 ? current[index] : null;

      if (!change.level) {
        if (!existing) return current;
        if (existing.standardIds.length) {
          const next = [...current];
          next[index] = { ...existing, dirbeLevel: null };
          return next;
        }
        return current.filter((_, itemIndex) => itemIndex !== index);
      }

      if (existing) {
        const next = [...current];
        next[index] = { ...existing, dirbeLevel: change.level };
        return next;
      }

      return [
        ...current,
        {
          subphaseId: change.subphaseId,
          missionKey: change.missionKey,
          maneuverId: change.maneuverId,
          standardIds: [],
          dirbeLevel: change.level,
        },
      ];
    });
    this.error.set(null);
  }

  async saveSubphase(subphaseId: string): Promise<void> {
    if (this.savingSubphaseId() || !this.programId || !this.dirtySubphaseIds().has(subphaseId)) return;
    const subphase = this.basePhases()
      .flatMap((phase) => phase.subphases)
      .find((item) => item.id === subphaseId);
    if (!subphase) return;

    this.error.set(null);
    this.savingSubphaseId.set(subphaseId);
    try {
      const matrixAssignments = this.assignments()
        .filter((assignment) => assignment.subphaseId === subphaseId)
        .filter((assignment) => Boolean(assignment.dirbeLevel) || assignment.standardIds.length > 0)
        .map<ManeuverStandardAssignment>((assignment) => ({
          missionKey: assignment.missionKey,
          maneuverId: assignment.maneuverId,
          standardIds: [...assignment.standardIds],
          ...(assignment.dirbeLevel ? { dirbeLevel: assignment.dirbeLevel } : {}),
        }));

      const updatedProgram = await firstValueFrom(
        this.saveStandardMatrix.execute(this.programId, {
          subphases: [{ subphaseId, assignments: matrixAssignments }],
        }),
      );
      if (this.left) return;

      this.program.set(updatedProgram);
      this.initialSubphaseMatrices.update((current) => ({
        ...current,
        [subphaseId]: this.subphaseSnapshot(subphaseId, this.assignments()),
      }));
      this.toast.success(
        'Subfase guardada',
        `La matriz de calificación de ${subphase.label} quedó actualizada.`,
      );
    } catch (err) {
      if (this.left) return;
      this.error.set(
        err instanceof DomainError
          ? err.message
          : 'No hemos podido guardar la matriz de calificación de esta subfase.',
      );
    } finally {
      if (!this.left && this.savingSubphaseId() === subphaseId) {
        this.savingSubphaseId.set(null);
      }
    }
  }

  private hydrate(data: {
    programs: ProgramEntity[];
    phases: PhaseEntity[];
    subphases: SubphaseEntity[];
    phaseBanks: PhaseBankEntity[];
    subphaseBanks: SubphaseBankEntity[];
    missionTypes: MissionTypeEntity[];
    operations: OperationEntity[];
    maneuvers: ManeuverBankEntity[];
  }): void {
    const program = data.programs.find((item) => item.id === this.programId);
    if (!program) {
      this.loadState.set('error');
      return;
    }

    const phaseBankById = new Map(data.phaseBanks.map((item) => [item.id, item] as const));
    const subphaseBankById = new Map(data.subphaseBanks.map((item) => [item.id, item] as const));
    const missionTypeById = new Map(data.missionTypes.map((item) => [item.id, item] as const));
    const operationById = new Map(data.operations.map((item) => [item.id, item] as const));
    const maneuverById = new Map(data.maneuvers.map((item) => [item.id, item] as const));
    const programPhases = data.phases
      .filter((phase) => phase.programId === program.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const phaseIds = new Set(programPhases.map((phase) => phase.id));
    const programSubphases = data.subphases.filter((subphase) => phaseIds.has(subphase.phaseId));

    const basePhases = programPhases.map<ProgramStandardPhaseBase>((phase) => {
      const bank = phaseBankById.get(phase.phaseBankId);
      const phaseCode = bank?.code ?? 'FASE';
      const phaseName = bank?.name ?? 'Fase sin catálogo';
      const subphases = programSubphases
        .filter((subphase) => subphase.phaseId === phase.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map<ProgramStandardSubphaseBase>((subphase) => {
          const subphaseBank = subphaseBankById.get(subphase.subphaseBankId);
          const code = subphaseBank?.code ?? 'SUB';
          const name = subphaseBank?.name ?? 'Subfase sin catálogo';
          return {
            id: subphase.id,
            phaseId: phase.id,
            code,
            name,
            label: `${code} · ${name}`,
            hours: subphase.hours,
            missions: this.toMissionViews(subphase, missionTypeById),
            maneuvers: subphase.maneuverIds
              .map((maneuverId) => maneuverById.get(maneuverId))
              .filter((maneuver): maneuver is ManeuverBankEntity => Boolean(maneuver))
              .map((maneuver) => {
                const operationId = subphase.maneuverAssignment[maneuver.id] || maneuver.operationId;
                const operation = operationById.get(operationId);
                return {
                  id: maneuver.id,
                  code: maneuver.code,
                  name: maneuver.name,
                  description: maneuver.description,
                  operationId: operationId || 'other',
                  operationName: operation?.name ?? 'Otras maniobras',
                };
              }),
          };
        });
      return {
        id: phase.id,
        code: phaseCode,
        name: phaseName,
        label: `${phaseCode} · ${phaseName}`,
        subphases,
      };
    });

    const assignments = programSubphases.flatMap<ProgramStandardCellAssignment>((subphase) =>
      (subphase.standardAssignments ?? []).map((assignment) => ({
        subphaseId: subphase.id,
        missionKey: assignment.missionKey,
        maneuverId: assignment.maneuverId,
        standardIds: [...assignment.standardIds],
        dirbeLevel: assignment.dirbeLevel ?? null,
      })),
    );

    const initialSubphaseMatrices: Record<string, string> = {};
    for (const subphase of basePhases.flatMap((phase) => phase.subphases)) {
      initialSubphaseMatrices[subphase.id] = this.subphaseSnapshot(subphase.id, assignments);
    }

    this.program.set(program);
    this.basePhases.set(basePhases);
    this.assignments.set(assignments);
    this.initialSubphaseMatrices.set(initialSubphaseMatrices);
    this.activePhaseId.set(basePhases[0]?.id ?? null);
    this.activeSubphaseId.set(null);
    this.loadState.set('ready');
  }

  private toMissionViews(
    subphase: SubphaseEntity,
    missionTypeById: ReadonlyMap<string, MissionTypeEntity>,
  ): ProgramStandardMissionView[] {
    return curriculumMissionRefs(subphase).map((mission, index) => {
      if (mission.kind === 'catalog') {
        const catalogMission = missionTypeById.get(mission.value);
        const rawCode = catalogMission?.code ?? `CAT-${index + 1}`;
        const { typeCode, missionCode } = this.missionCodes(rawCode);
        const name = catalogMission?.name ?? 'Misión de catálogo no disponible';
        return {
          key: mission.key,
          typeCode,
          code: missionCode,
          name,
          label: `${missionCode} · ${name}`,
          detail: catalogMission?.description || 'Misión vinculada al catálogo académico.',
          kindLabel: 'Catálogo',
        };
      }
      if (mission.kind === 'automatic') {
        const { typeCode, missionCode } = this.missionCodes(
          mission.value,
          subphase.autoMissionCode,
        );
        return {
          key: mission.key,
          typeCode,
          code: missionCode,
          name: 'Misión automática',
          label: missionCode,
          detail: `Misión generada automáticamente dentro de la serie ${subphase.autoMissionCode}.`,
          kindLabel: 'Serie',
        };
      }
      const code = `M${index + 1}`;
      return {
        key: mission.key,
        typeCode: 'MAN',
        code,
        name: mission.value,
        label: `${code} · ${mission.value}`,
        detail: 'Misión específica definida dentro de esta subfase.',
        kindLabel: 'Propia',
      };
    });
  }

  private missionCodes(
    code: string,
    fallbackTypeCode = 'MIS',
  ): { typeCode: string; missionCode: string } {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { typeCode: fallbackTypeCode, missionCode: fallbackTypeCode };
    }

    const [explicitTypeCode, ...missionCodeParts] = normalized.split(/\s+/);
    if (missionCodeParts.length) {
      return {
        typeCode: explicitTypeCode,
        missionCode: missionCodeParts.join(' '),
      };
    }

    const numbered = normalized.match(/^(.+?)-?\d+$/);
    const typeCode = numbered?.[1]?.replace(/-+$/, '').trim();
    return {
      typeCode: typeCode || normalized,
      missionCode: normalized,
    };
  }

  private toSubphaseView(
    subphase: ProgramStandardSubphaseBase,
    assignments: readonly ProgramStandardCellAssignment[],
  ): ProgramStandardSubphaseView {
    const totalCells = subphase.missions.length * subphase.maneuvers.length;
    const validCells = new Set(
      assignments
        .filter((assignment) => assignment.subphaseId === subphase.id && Boolean(assignment.dirbeLevel))
        .map((assignment) => programStandardCellKey(assignment)),
    );
    const configuredCells = validCells.size;
    const levelsUsed = new Set(
      assignments
        .filter((assignment) => assignment.subphaseId === subphase.id)
        .map((assignment) => assignment.dirbeLevel)
        .filter((level): level is DirbeLevel => Boolean(level)),
    ).size;
    return {
      ...subphase,
      configuredCells,
      totalCells,
      levelsUsed,
      percentage: totalCells ? Math.round((configuredCells / totalCells) * 100) : 0,
      hasMatrix: totalCells > 0,
      matrixHint: this.matrixHint(subphase),
    };
  }

  private matrixHint(subphase: ProgramStandardSubphaseBase): string {
    if (!subphase.missions.length && !subphase.maneuvers.length) {
      return 'Añade al menos una misión y una maniobra en la estructura del programa.';
    }
    if (!subphase.missions.length) {
      return 'Añade al menos una misión en la estructura del programa.';
    }
    return 'Añade al menos una maniobra en la estructura del programa.';
  }

  private subphaseSnapshot(
    subphaseId: string,
    assignments: readonly ProgramStandardCellAssignment[],
  ): string {
    return JSON.stringify(
      assignments
        .filter((assignment) => assignment.subphaseId === subphaseId)
        .map((assignment) => ({
          missionKey: assignment.missionKey,
          maneuverId: assignment.maneuverId,
          standardIds: [...new Set(assignment.standardIds)].sort(),
          dirbeLevel: assignment.dirbeLevel,
        }))
        .filter((assignment) => Boolean(assignment.dirbeLevel) || assignment.standardIds.length > 0)
        .sort((a, b) => {
          const cellCompare = standardCellKey(a.missionKey, a.maneuverId).localeCompare(
            standardCellKey(b.missionKey, b.maneuverId),
          );
          if (cellCompare) return cellCompare;
          const levelCompare = (a.dirbeLevel ?? '').localeCompare(b.dirbeLevel ?? '');
          return levelCompare || a.standardIds.join('|').localeCompare(b.standardIds.join('|'));
        }),
    );
  }
}
