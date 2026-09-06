import { describe, expect, it } from 'vitest';
import {
  missionHasDangerousGrade,
  missionManeuverAverage,
  missionResultFromManeuverGrades,
} from './mission-execution-grade';

describe('calificación de misión', () => {
  it('desaprueba la misión si alguna maniobra es peligrosa', () => {
    expect(missionHasDangerousGrade(['B', 'P', 'E'])).toBe(true);
    expect(missionResultFromManeuverGrades(['B', 'P'], 'approved')).toBe('failed');
    expect(missionResultFromManeuverGrades(['B', 'E'], 'failed')).toBeNull();
    expect(missionResultFromManeuverGrades(['B', 'E'], 'approved')).toBe('approved');
  });

  it('calcula el promedio de las maniobras calificadas', () => {
    expect(missionManeuverAverage(['B', 'E'])).toBe(18);
    expect(missionManeuverAverage([null, null])).toBeNull();
  });
});
