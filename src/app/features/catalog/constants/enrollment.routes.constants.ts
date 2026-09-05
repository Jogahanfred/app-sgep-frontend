export const ENROLLMENT_LIST_PATH = '/catalogo/matricula/asignacion';
export const ENROLLMENT_LIST_TAB_QUERY = 'lista';
export const ENROLLMENT_LIST_TAB = {
  group: 'promocion',
  individual: 'alumno',
} as const;

export function enrollmentListUrl(kind: 'group' | 'individual'): string {
  return `${ENROLLMENT_LIST_PATH}?${ENROLLMENT_LIST_TAB_QUERY}=${ENROLLMENT_LIST_TAB[kind]}`;
}

export function enrollmentListTabFromQuery(value: string | null): 'group' | 'individual' | null {
  if (value === ENROLLMENT_LIST_TAB.individual) return 'individual';
  if (value === ENROLLMENT_LIST_TAB.group) return 'group';
  return null;
}
