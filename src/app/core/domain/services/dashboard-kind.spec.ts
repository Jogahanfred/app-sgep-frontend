import { describe, expect, it } from 'vitest';
import { dashboardKindForRole } from './dashboard-kind';

describe('dashboardKindForRole', () => {
  it('asigna el panel según el rol', () => {
    expect(dashboardKindForRole('COMDO')).toBe('director');
    expect(dashboardKindForRole('ADSYS')).toBe('director');
    expect(dashboardKindForRole('INSTR')).toBe('instructor');
    expect(dashboardKindForRole('EVALU')).toBe('instructor');
    expect(dashboardKindForRole('PILOT')).toBe('student');
  });
});
