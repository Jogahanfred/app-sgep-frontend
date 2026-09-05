export const ROLE_CODES = [
  'ADSYS',
  'ADPER',
  'COMDO',
  'JESQD',
  'JOPER',
  'JINST',
  'INSTR',
  'EVALU',
  'PILOT',
  'AUDIT',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_PROFILES: Record<
  RoleCode,
  { readonly name: string; readonly level: string; readonly category: string }
> = {
  ADSYS: { name: 'Administrador del sistema', level: 'NIVEL V', category: 'Gobernanza' },
  ADPER: { name: 'Administrador de personal', level: 'NIVEL III', category: 'Dotación' },
  COMDO: { name: 'Comando', level: 'NIVEL IV', category: 'Alta dirección' },
  JESQD: { name: 'Jefe de escuadrón', level: 'NIVEL IV', category: 'Comando táctico' },
  JOPER: { name: 'Jefe de operaciones', level: 'NIVEL III', category: 'Operaciones' },
  JINST: { name: 'Jefe de instrucción', level: 'NIVEL III', category: 'Curricular' },
  INSTR: { name: 'Instructor', level: 'NIVEL II', category: 'Instrucción' },
  EVALU: { name: 'Evaluador', level: 'NIVEL II', category: 'Estandarización' },
  PILOT: { name: 'Piloto', level: 'NIVEL 0', category: 'Entrenamiento' },
  AUDIT: { name: 'Consulta / Auditor', level: 'NIVEL 0', category: 'Fiscalización' },
};

export function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}
