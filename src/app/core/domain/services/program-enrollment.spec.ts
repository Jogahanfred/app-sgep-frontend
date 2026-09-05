import { describe, expect, it } from 'vitest';
import { InvalidAdminCatalogError } from '../errors/domain-error';
import {
  assertProgramEnrollmentClose,
  assertProgramEnrollmentWrite,
  assertStudentCanReceiveAssignment,
  canEnrollInProgram,
  enrollmentAllowsAcademicWrite,
  enrollmentStatusLabel,
} from './program-enrollment';

describe('program-enrollment', () => {
  it('exige promoción o alumno según la modalidad', () => {
    expect(() =>
      assertProgramEnrollmentWrite({
        programId: 'prg-heli-2023',
        source: 'promotion',
        promotionId: 'promotion-2025-alfa',
        userId: null,
        enrolledAt: '2026-03-01',
      }),
    ).toThrow(InvalidAdminCatalogError);
    expect(
      assertProgramEnrollmentWrite({
        programId: 'prg-ppl',
        source: 'promotion',
        promotionId: 'promotion-2026-i',
        userId: null,
        userIds: ['usr-ivan-rubio-nadal', ' usr-marta-cos-varela '],
        enrolledAt: '2026-03-01',
      }),
    ).toMatchObject({ userIds: ['usr-ivan-rubio-nadal', 'usr-marta-cos-varela'] });
    expect(
      assertProgramEnrollmentWrite({
        programId: 'prg-heli-2023',
        source: 'individual',
        promotionId: 'promotion-2025-alfa',
        userId: 'usr-diego-molina',
        enrolledAt: '2026-03-01',
      }),
    ).toMatchObject({ source: 'individual', promotionId: null, userId: 'usr-diego-molina' });
    expect(() =>
      assertProgramEnrollmentWrite({
        programId: 'prg-heli-2023',
        source: 'promotion',
        promotionId: null,
        userId: 'usr-diego-molina',
        enrolledAt: '2026-03-01',
      }),
    ).toThrow(InvalidAdminCatalogError);
  });

  it('permite matricular a instrucción y no al piloto', () => {
    expect(canEnrollInProgram('JINST')).toBe(true);
    expect(canEnrollInProgram('PILOT')).toBe(false);
    expect(canEnrollInProgram('AUDIT')).toBe(false);
  });

  it('cierra la matrícula con motivo y bloquea nuevas misiones', () => {
    expect(enrollmentAllowsAcademicWrite('active')).toBe(true);
    expect(enrollmentAllowsAcademicWrite('dropped')).toBe(false);
    expect(enrollmentStatusLabel('dropped')).toBe('Dado de baja');
    expect(
      assertProgramEnrollmentClose({
        status: 'dropped',
        closedAt: '2026-09-04',
        closeReason: 'Incumplimiento académico',
      }),
    ).toMatchObject({ status: 'dropped' });
    expect(() =>
      assertStudentCanReceiveAssignment(
        [
          {
            id: 'e1',
            programId: 'prg-ppl',
            userId: 'usr-1',
            promotionId: 'p1',
            source: 'promotion',
            enrolledAt: '2026-01-01',
            status: 'dropped',
            closedAt: '2026-09-04',
            closeReason: 'Incumplimiento académico',
          },
        ],
        'usr-1',
        'prg-ppl',
      ),
    ).toThrow(InvalidAdminCatalogError);
  });
});
