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
} from '@core/application';
import type {
  ManeuverBankEntity,
  MissionTypeEntity,
  OperationEntity,
  PhaseBankEntity,
  ProgramEntity,
  SubphaseBankEntity,
  SubphaseEntity,
} from '@core/domain/entities';
import { curriculumHours, expandAutoMissions, programTypeLabel } from '@core/domain/services/admin-catalog';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiChip } from '@shared/components/ui-chip/ui-chip';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';

interface FlowGroup {
  name: string;
  maneuvers: string[];
}

interface FlowLesson {
  name: string;
  hours: number;
  missions: string[];
  groups: FlowGroup[];
  loose: string[];
}

interface FlowPhase {
  name: string;
  hours: number;
  lessons: FlowLesson[];
}

@Component({
  selector: 'app-program-flow-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, UiChip, UiLoading],
  templateUrl: './program-flow.page.html',
  styleUrl: './program-flow.page.scss',
})
export class ProgramFlowPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);
  private readonly listMissions = inject(ListMissionTypes);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly listOperations = inject(ListOperations);

  readonly programId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly listHref = '/catalogo/programas';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly program = signal<ProgramEntity | null>(null);
  readonly phases = signal<FlowPhase[]>([]);

  readonly title = computed(() => {
    const name = this.program()?.name;
    return name ? `Flujo de ${name}` : 'Flujo del programa';
  });

  readonly typeName = computed(() => {
    const type = this.program()?.programType;
    return type ? programTypeLabel(type) : '';
  });

  readonly totalHours = computed(() => curriculumHours(this.phases().map((phase) => ({ subphases: phase.lessons }))));
  readonly lessonCount = computed(() => this.phases().reduce((sum, phase) => sum + phase.lessons.length, 0));

  constructor() {
    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
      phaseBanks: this.listPhaseBanks.execute(),
      subphaseBanks: this.listSubphaseBanks.execute(),
      missions: this.listMissions.execute(),
      maneuvers: this.listManeuvers.execute(),
      operations: this.listOperations.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bundle) => {
          const program = bundle.programs.find((item) => item.id === this.programId);
          if (!program) {
            this.loadState.set('error');
            return;
          }
          this.program.set(program);
          this.phases.set(
            bundle.phases
              .filter((item) => item.programId === program.id)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((phase) => {
                const lessons = bundle.subphases
                  .filter((item) => item.phaseId === phase.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((sub) => this.toLesson(sub, bundle));
                return {
                  name: this.phaseName(phase.phaseBankId, bundle.phaseBanks),
                  hours: lessons.reduce((sum, item) => sum + item.hours, 0),
                  lessons,
                };
              }),
          );
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  private toLesson(
    sub: SubphaseEntity,
    bundle: {
      subphaseBanks: SubphaseBankEntity[];
      missions: MissionTypeEntity[];
      maneuvers: ManeuverBankEntity[];
      operations: OperationEntity[];
    },
  ): FlowLesson {
    const bank = bundle.subphaseBanks.find((item) => item.id === sub.subphaseBankId);
    const missions =
      sub.missionMode === 'automatic'
        ? expandAutoMissions(sub.autoMissionCode, sub.autoMissionCount)
        : [
            ...sub.missionTypeIds.map((id) => {
              const mission = bundle.missions.find((item) => item.id === id);
              return mission ? `${mission.code} · ${mission.name}` : id;
            }),
            ...sub.customMissionNames,
          ];
    const maneuverById = new Map(bundle.maneuvers.map((item) => [item.id, `${item.code} · ${item.name}`]));
    const groups: FlowGroup[] = [];
    const seen = new Set<string>();
    for (const operationId of sub.maneuverOperationIds) {
      const operation = bundle.operations.find((item) => item.id === operationId);
      const maneuvers = sub.maneuverIds
        .filter((id) => sub.maneuverAssignment[id] === operationId)
        .map((id) => maneuverById.get(id) ?? id);
      if (!maneuvers.length) continue;
      maneuvers.forEach((label) => seen.add(label));
      groups.push({ name: operation?.name ?? 'Operación', maneuvers });
    }
    const loose = sub.maneuverIds
      .map((id) => maneuverById.get(id) ?? id)
      .filter((label) => !seen.has(label));
    return {
      name: bank ? `${bank.code} · ${bank.name}` : 'Subfase',
      hours: sub.hours,
      missions,
      groups,
      loose,
    };
  }

  private phaseName(phaseBankId: string, banks: PhaseBankEntity[]): string {
    const bank = banks.find((item) => item.id === phaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : 'Fase';
  }
}
