import { describe, expect, it } from 'vitest';
import { easeInOutCubic } from './scroll-to';

describe('easeInOutCubic', () => {
  it('empieza lento, acelera y termina lento', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});
