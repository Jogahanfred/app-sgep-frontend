import type { DirbeLevel } from '@core/domain/entities';

export interface StandardMatrixProgress {
  configuredCells: number;
  totalCells: number;
  levelsUsed: number;
  percentage: number;
}

export interface ProgramStandardMissionView {
  key: string;
  typeCode: string;
  code: string;
  name: string;
  label: string;
  detail: string;
  kindLabel: string;
}

export interface ProgramStandardManeuverView {
  id: string;
  code: string;
  name: string;
  description: string;
  operationId: string;
  operationName: string;
}

export interface ProgramStandardSubphaseView extends StandardMatrixProgress {
  id: string;
  phaseId: string;
  code: string;
  name: string;
  label: string;
  hours: number;
  missions: ProgramStandardMissionView[];
  maneuvers: ProgramStandardManeuverView[];
  hasMatrix: boolean;
  matrixHint: string;
}

export interface ProgramStandardPhaseView extends StandardMatrixProgress {
  id: string;
  code: string;
  name: string;
  label: string;
  subphases: ProgramStandardSubphaseView[];
}

/**
 * Se conserva porque el selector de estándares de catálogo continúa disponible
 * para otros flujos, aunque la matriz de la subfase utiliza la escala DIRBE.
 */
export interface ProgramStandardOption {
  id: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface ProgramStandardAssignmentTarget {
  subphaseId: string;
  missionKey: string;
  maneuverId: string;
}

export interface ProgramStandardDirbeChange extends ProgramStandardAssignmentTarget {
  level: DirbeLevel | null;
}

export interface DirbeOption {
  value: DirbeLevel;
  label: string;
  description: string;
}

export const DIRBE_OPTIONS: readonly DirbeOption[] = [
  {
    value: 'D',
    label: 'Demostración',
    description: 'La maniobra se presenta y demuestra con guía directa del instructor.',
  },
  {
    value: 'I',
    label: 'Insuficiente',
    description: 'El desempeño todavía no alcanza el nivel mínimo esperado.',
  },
  {
    value: 'R',
    label: 'Regular',
    description: 'La maniobra se ejecuta parcialmente y requiere correcciones frecuentes.',
  },
  {
    value: 'B',
    label: 'Bueno',
    description: 'La maniobra cumple el estándar previsto para esta misión.',
  },
  {
    value: 'E',
    label: 'Excelente',
    description: 'La maniobra supera el estándar y se ejecuta con dominio y consistencia.',
  },
] as const;

export function standardCellKey(missionKey: string, maneuverId: string): string {
  return `${missionKey}\u001f${maneuverId}`;
}

export function programStandardCellKey(target: ProgramStandardAssignmentTarget): string {
  return `${target.subphaseId}\u001e${standardCellKey(target.missionKey, target.maneuverId)}`;
}
