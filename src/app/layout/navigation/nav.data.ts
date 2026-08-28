import type { NavGroup } from '@shared/models/nav.model';

export const MAIN_NAV: NavGroup[] = [
  {
    label: 'Productos',
    children: [
      { label: 'Cuentas', href: '/cuentas', description: 'El día a día, sin letra pequeña.' },
      { label: 'Tarjetas', href: '/tarjetas', description: 'Débito, crédito y pagos móviles.' },
    ],
  },
  {
    label: 'Financiación',
    children: [
      { label: 'Préstamos', href: '/prestamos', description: 'Impulso, movilidad y reformas.' },
      { label: 'Hipotecas', href: '/hipotecas', description: 'Fija, variable o mixta.' },
    ],
  },
  {
    label: 'Inversión',
    href: '/inversion',
    children: [
      { label: 'Fondos y carteras', href: '/inversion', description: 'Desde 50 €, con perfil de riesgo.' },
      { label: 'Ahorro y jubilación', href: '/inversion', description: 'Huchas y Plan Albada.' },
    ],
  },
  {
    label: 'Ayuda',
    children: [
      { label: 'Preguntas frecuentes', href: '/#preguntas-frecuentes', description: 'Dudas habituales sobre productos.' },
      { label: 'Hazte cliente', href: '/hazte-cliente', description: 'Alta digital en unos minutos.' },
    ],
  },
];
