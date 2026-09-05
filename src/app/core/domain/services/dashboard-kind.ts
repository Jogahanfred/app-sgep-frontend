import type { RoleCode } from '../entities/role-code';

export const DASHBOARD_KINDS = ['director', 'instructor', 'student'] as const;
export type DashboardKind = (typeof DASHBOARD_KINDS)[number];

export function dashboardKindForRole(role: RoleCode): DashboardKind {
  if (role === 'PILOT') return 'student';
  if (role === 'INSTR' || role === 'EVALU') return 'instructor';
  return 'director';
}
