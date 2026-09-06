/** Tope de misiones reprobadas que obliga a convocar consejo de evaluación. */
export const EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD = 2;

export const EVALUATION_COUNCIL_MEMBER_USER_IDS = {
  president: 'usr-diego-herrera',
  vocalOps: 'usr-nuria-vega',
  vocalInstruction: 'usr-carmen-lopez',
  vocalSafety: 'usr-hector-diaz',
  secretary: 'usr-ricardo-pena',
} as const;

export const EVALUATION_COUNCIL_RESOLUTION_OPTIONS = ['reinforcement', 'reclassify', 'medical-hold'] as const;

export type EvaluationCouncilResolutionOption = (typeof EVALUATION_COUNCIL_RESOLUTION_OPTIONS)[number];
