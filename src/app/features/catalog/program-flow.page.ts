import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  ListManeuvers,
  ListMissionTypes,
  ListPhaseBanks,
  ListPhases,
  ListPrograms,
  ListSubphaseBanks,
  ListSubphases,
} from '@core/application';
import type {
  ManeuverBankEntity,
  MissionTypeEntity,
  PhaseBankEntity,
  ProgramEntity,
  SubphaseBankEntity,
  SubphaseEntity,
} from '@core/domain/entities';
import { curriculumHours, expandAutoMissions, programTypeLabel } from '@core/domain/services/admin-catalog';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiGuidedTour } from '@shared/components/ui-guided-tour/ui-guided-tour';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { buildFlowTourSteps, readTourMemory, writeTourMemory, type FlowTourStep } from './program-flow.tour';

export type FlowDepth = 'start' | 'phase' | 'lesson' | 'matrix';

export interface FlowStop {
  depth: FlowDepth;
  phaseIndex: number;
  lessonIndex: number;
}

export interface FlowMission {
  name: string;
  detail: string;
}

export interface FlowLesson {
  name: string;
  hours: number;
  missions: FlowMission[];
  maneuvers: string[];
}

export interface FlowPhase {
  name: string;
  hours: number;
  lessons: FlowLesson[];
}

export function buildFlowStops(phases: { lessons: unknown[] }[]): FlowStop[] {
  const stops: FlowStop[] = [{ depth: 'start', phaseIndex: -1, lessonIndex: -1 }];
  phases.forEach((phase, phaseIndex) => {
    stops.push({ depth: 'phase', phaseIndex, lessonIndex: -1 });
    phase.lessons.forEach((_, lessonIndex) => {
      stops.push({ depth: 'lesson', phaseIndex, lessonIndex });
      stops.push({ depth: 'matrix', phaseIndex, lessonIndex });
    });
  });
  return stops;
}

@Component({
  selector: 'app-program-flow-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Button, Modal, UiGuidedTour, UiLoading],
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

  readonly programId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly listHref = '/catalogo/programas';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly program = signal<ProgramEntity | null>(null);
  readonly phases = signal<FlowPhase[]>([]);
  readonly stops = signal<FlowStop[]>([]);
  readonly cursor = signal(0);
  readonly tourOpen = signal(false);
  readonly tourIndex = signal(0);
  readonly tourSteps = computed(() => buildFlowTourSteps(this.phases()));
  readonly tourStep = computed(() => this.tourSteps()[this.tourIndex()] ?? null);
  readonly tourCoach = computed(() => {
    const step = this.tourStep();
    return this.tourOpen() && !!step?.target;
  });
  readonly tourIntro = computed(() => this.tourOpen() && this.tourStep()?.kind === 'intro');
  readonly tourFinish = computed(() => this.tourOpen() && this.tourStep()?.kind === 'finish');
  readonly tourOnMatrix = computed(() => this.tourStep()?.kind === 'matrix');

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
  readonly stop = computed(() => this.stops()[this.cursor()] ?? null);
  readonly phaseIndex = computed(() => this.stop()?.phaseIndex ?? -1);
  readonly lessonIndex = computed(() => this.stop()?.lessonIndex ?? -1);
  readonly depth = computed(() => this.stop()?.depth ?? 'start');
  readonly currentPhase = computed(() => {
    const index = this.stop()?.phaseIndex ?? -1;
    return index >= 0 ? (this.phases()[index] ?? null) : null;
  });
  readonly currentLesson = computed(() => {
    const point = this.stop();
    const phase = this.currentPhase();
    if (!point || !phase || point.lessonIndex < 0) return null;
    return phase.lessons[point.lessonIndex] ?? null;
  });
  readonly isFirst = computed(() => this.cursor() <= 0);
  readonly isLast = computed(() => {
    const total = this.stops().length;
    return total === 0 || this.cursor() >= total - 1;
  });
  readonly stepLabel = computed(() => {
    const point = this.stop();
    const phase = this.currentPhase();
    const lesson = this.currentLesson();
    if (!point || point.depth === 'start') return 'Inicio';
    if (point.depth === 'phase') {
      return `Fase ${point.phaseIndex + 1} de ${this.phases().length}`;
    }
    if (point.depth === 'lesson' && phase) {
      return `Subfase ${point.lessonIndex + 1} de ${phase.lessons.length}`;
    }
    if (point.depth === 'matrix' && lesson) {
      return `Matriz · ${lesson.missions.length} × ${lesson.maneuvers.length}`;
    }
    return '';
  });
  readonly crumb = computed(() => {
    const phase = this.currentPhase();
    const lesson = this.currentLesson();
    if (!phase) return 'Programa';
    if (!lesson) return phase.name;
    if (this.depth() === 'matrix') return `${phase.name} · ${lesson.name} · Matriz`;
    return `${phase.name} · ${lesson.name}`;
  });

  goBack(): void {
    if (this.isFirst()) return;
    this.cursor.update((value) => value - 1);
  }

  goNext(): void {
    if (this.isLast()) return;
    this.cursor.update((value) => value + 1);
  }

  goTo(phaseIndex: number): void {
    const index = this.stops().findIndex((item) => item.depth === 'phase' && item.phaseIndex === phaseIndex);
    if (index < 0) return;
    this.cursor.set(index);
  }

  startTour(): void {
    if (!this.tourSteps().length) return;
    this.tourIndex.set(0);
    this.tourOpen.set(true);
    const step = this.tourSteps()[0];
    if (step) this.revealForTour(step);
  }

  finishTour(): void {
    writeTourMemory(this.programId, 'completed');
    this.tourOpen.set(false);
  }

  tourNext(): void {
    if (this.tourIndex() >= this.tourSteps().length - 1) {
      this.finishTour();
      return;
    }
    writeTourMemory(this.programId, 'started');
    this.tourIndex.update((value) => value + 1);
    const step = this.tourSteps()[this.tourIndex()];
    if (step) this.revealForTour(step);
  }

  tourPrev(): void {
    if (this.tourIndex() <= 0) return;
    this.tourIndex.update((value) => value - 1);
    const step = this.tourSteps()[this.tourIndex()];
    if (step) this.revealForTour(step);
  }

  missionCountLabel(count: number): string {
    return count === 1 ? '1 misión' : `${count} misiones`;
  }

  constructor() {
    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
      phaseBanks: this.listPhaseBanks.execute(),
      subphaseBanks: this.listSubphaseBanks.execute(),
      missions: this.listMissions.execute(),
      maneuvers: this.listManeuvers.execute(),
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
          const phases = bundle.phases
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
            });
          this.phases.set(phases);
          this.stops.set(buildFlowStops(phases));
          this.cursor.set(0);
          this.loadState.set('ready');
          if (readTourMemory(program.id) === 'idle' && phases.length) {
            this.startTour();
          }
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
    },
  ): FlowLesson {
    const bank = bundle.subphaseBanks.find((item) => item.id === sub.subphaseBankId);
    const missions =
      sub.missionMode === 'automatic'
        ? expandAutoMissions(sub.autoMissionCode, sub.autoMissionCount).map((name, index, items) => ({
            name,
            detail: `Serie automática ${sub.autoMissionCode} · vuelo ${index + 1} de ${items.length}`,
          }))
        : [
            ...sub.missionTypeIds.map((id) => {
              const mission = bundle.missions.find((item) => item.id === id);
              return {
                name: mission ? `${mission.code} · ${mission.name}` : id,
                detail: mission?.description || 'Misión del catálogo.',
              };
            }),
            ...sub.customMissionNames.map((name) => ({
              name,
              detail: 'Misión anotada en esta subfase.',
            })),
          ];
    const maneuverById = new Map(bundle.maneuvers.map((item) => [item.id, item]));
    const maneuvers = sub.maneuverIds.map((id) => {
      const item = maneuverById.get(id);
      return item ? `${item.code} · ${item.name}` : id;
    });
    return {
      name: bank ? `${bank.code} · ${bank.name}` : 'Subfase',
      hours: sub.hours,
      missions,
      maneuvers,
    };
  }

  private revealForTour(step: FlowTourStep): void {
    if (step.kind === 'intro') {
      this.cursor.set(0);
      return;
    }
    const depth = step.kind === 'phase' ? 'phase' : step.kind === 'matrix' ? 'matrix' : 'lesson';
    const index = this.stops().findIndex(
      (item) =>
        item.depth === depth && item.phaseIndex === step.phaseIndex && item.lessonIndex === step.lessonIndex,
    );
    if (index >= 0) this.cursor.set(index);
  }

  private phaseName(phaseBankId: string, banks: PhaseBankEntity[]): string {
    const bank = banks.find((item) => item.id === phaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : 'Fase';
  }
}
