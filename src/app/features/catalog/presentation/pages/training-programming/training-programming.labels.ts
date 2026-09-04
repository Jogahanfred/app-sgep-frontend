import type { IndividualAssignmentCase, TrainingAssignmentStatus } from '@core/domain/entities';
export function trainingAssignmentStatusLabel(status: TrainingAssignmentStatus): string { return { scheduled: 'Programado', assigned: 'Asignado', 'in-progress': 'En curso', completed: 'Completado', cancelled: 'Cancelado' }[status]; }
export function individualCaseLabel(value: IndividualAssignmentCase): string { return { pdi: 'PDI', pde: 'PDE', commission: 'Comisión' }[value]; }
