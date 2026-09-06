import { describe, expect, it } from 'vitest';
import { airGradeTileStatus, airGradeTileTone } from './air-grade-tiles';

describe('airGradeTileStatus', () => {
  it('marca pendiente cuando no hay nota ni resultado', () => {
    expect(airGradeTileStatus({ average: null, result: null })).toBe('pending');
  });

  it('prioriza el dictamen sobre la nota', () => {
    expect(airGradeTileStatus({ average: 18, result: 'failed' })).toBe('insufficient');
    expect(airGradeTileStatus({ average: 18, result: 'approved-observations' })).toBe('observed');
  });

  it('usa los umbrales vigesimales para el tono', () => {
    expect(airGradeTileStatus({ average: 11, result: 'approved' })).toBe('insufficient');
    expect(airGradeTileStatus({ average: 14, result: 'approved' })).toBe('regular');
    expect(airGradeTileStatus({ average: 16.8, result: 'approved' })).toBe('approved');
    expect(airGradeTileStatus({ average: 18, result: 'approved' })).toBe('outstanding');
    expect(airGradeTileTone('outstanding')).toBe('pass');
    expect(airGradeTileTone('observed')).toBe('fail');
  });
});
