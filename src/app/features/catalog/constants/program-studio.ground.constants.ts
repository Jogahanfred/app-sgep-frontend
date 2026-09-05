import type { GroundPeriodicDraft, GroundSubjectDraft } from '../types/program-studio.types';

export const EMPTY_GROUND_SUBJECT_DRAFT: GroundSubjectDraft = {
  name: '',
  hours: 1,
  coefficient: 0,
  minPassingGrade: 16,
};

export const EMPTY_GROUND_PERIODIC_DRAFT: GroundPeriodicDraft = {
  period: '',
  exam: '',
  minPassingGrade: 16,
  neiWeight: 1,
};
