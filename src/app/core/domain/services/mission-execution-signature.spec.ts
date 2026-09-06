import { canSignMissionPad } from './mission-execution-signature';

describe('canSignMissionPad', () => {
  const assignment = { instructorId: 'usr-inst', studentId: 'usr-alum' };

  it('deja firmar al instructor solo su apartado y al alumno el suyo', () => {
    expect(
      canSignMissionPad('instructor', { userId: 'usr-inst', roleCode: 'INSTR' }, assignment),
    ).toBe(true);
    expect(
      canSignMissionPad('student', { userId: 'usr-inst', roleCode: 'INSTR' }, assignment),
    ).toBe(false);
    expect(
      canSignMissionPad('student', { userId: 'usr-alum', roleCode: 'PILOT' }, assignment),
    ).toBe(true);
    expect(
      canSignMissionPad('instructor', { userId: 'usr-alum', roleCode: 'PILOT' }, assignment),
    ).toBe(false);
  });
});
