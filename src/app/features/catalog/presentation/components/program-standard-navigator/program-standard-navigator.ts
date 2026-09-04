import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '@shared/components/icon/icon';
import type {
  ProgramStandardPhaseView,
  ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';

@Component({
  selector: 'app-program-standard-navigator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './program-standard-navigator.html',
  styleUrl: './program-standard-navigator.scss',
})
export class ProgramStandardNavigator {
  readonly phases = input.required<readonly ProgramStandardPhaseView[]>();
  readonly activePhaseId = input<string | null>(null);
  readonly activeSubphaseId = input<string | null>(null);
  readonly dirtySubphaseIds = input<ReadonlySet<string>>(new Set<string>());
  readonly phaseSelected = output<string>();
  readonly subphaseSelected = output<string>();

  readonly totalProgress = computed(() => {
    const phases = this.phases();
    const configuredCells = phases.reduce((sum, phase) => sum + phase.configuredCells, 0);
    const totalCells = phases.reduce((sum, phase) => sum + phase.totalCells, 0);
    return {
      configuredCells,
      totalCells,
      percentage: totalCells ? Math.round((configuredCells / totalCells) * 100) : 0,
    };
  });

  phaseStatus(phase: ProgramStandardPhaseView): string {
    if (this.isPhaseDirty(phase)) return 'Sin guardar';
    if (!phase.totalCells) return 'Sin matriz';
    if (!phase.configuredCells) return 'Sin iniciar';
    if (phase.configuredCells >= phase.totalCells) return 'Completa';
    return 'En progreso';
  }

  subphaseStatus(subphase: ProgramStandardSubphaseView): string {
    if (this.isDirty(subphase.id)) return 'Sin guardar';
    if (!subphase.hasMatrix) return 'Sin matriz';
    if (!subphase.configuredCells) return 'Sin iniciar';
    if (subphase.configuredCells >= subphase.totalCells) return 'Completa';
    return 'En progreso';
  }


  isDirty(subphaseId: string): boolean {
    return this.dirtySubphaseIds().has(subphaseId);
  }

  isPhaseDirty(phase: ProgramStandardPhaseView): boolean {
    return phase.subphases.some((subphase) => this.isDirty(subphase.id));
  }

  missionLabel(count: number): string {
    return count === 1 ? '1 misión' : `${count} misiones`;
  }

  maneuverLabel(count: number): string {
    return count === 1 ? '1 maniobra' : `${count} maniobras`;
  }
}
