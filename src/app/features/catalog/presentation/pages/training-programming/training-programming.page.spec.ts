import { describe, expect, it } from 'vitest';
import { trainingAssignmentStatusLabel } from './training-programming.labels';

describe('training programming labels', () => {
  it('translates the assignment workflow', () => {
    expect(trainingAssignmentStatusLabel('in-progress')).toBe('En curso');
  });
});
