import type { LoginShowcaseMetric } from './login-screen.types';

export const LOGIN_DEFAULT_NEXT_URL = '/perfil';
export const LOGIN_SHOWCASE_IMAGE = '/login-showcase.jpg';
export const LOGIN_USER_MIN_LENGTH = 4;
export const LOGIN_PASSWORD_MIN_LENGTH = 6;

export const LOGIN_SHOWCASE_METRICS: readonly LoginShowcaseMetric[] = [
  { id: 'aircraft', label: 'Aeronaves activas', value: '142', unit: 'VLO' },
  { id: 'efficiency', label: 'Eficiencia global', value: '98.4', unit: '%' },
  { id: 'simulators', label: 'Simuladores CAT-VI', value: '18', unit: 'OPR' },
];
