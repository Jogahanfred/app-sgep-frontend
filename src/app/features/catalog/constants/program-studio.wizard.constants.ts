import type { ProgramModuleKind } from '@core/domain/entities';
import type { StudioDirbepCode, StudioWizardStep } from '../types/program-studio.types';

export const PROGRAM_STUDIO_STEPS: readonly StudioWizardStep[] = ['plan', 'modules', 'architecture', 'matrix'];

export const DIRBEP_CODES: readonly StudioDirbepCode[] = ['D', 'I', 'R', 'B', 'E', 'P'];

export const MATRIX_PAN_THRESHOLD = 6;

export function visibleStudioWizardSteps(includeMatrix: boolean): readonly StudioWizardStep[] {
  return includeMatrix ? PROGRAM_STUDIO_STEPS : PROGRAM_STUDIO_STEPS.filter((step) => step !== 'matrix');
}

export const PROGRAM_MODULE_OPTIONS: readonly { kind: ProgramModuleKind; title: string; hint: string }[] = [
  { kind: 'ground', title: 'Tierra', hint: 'Instrucción en tierra (cursos y asignaturas).' },
  { kind: 'air', title: 'Aire', hint: 'Instrucción en vuelo: fases y subfases.' },
  { kind: 'simulator', title: 'Simulador', hint: 'Entrenamiento en dispositivo: fases y subfases.' },
];
