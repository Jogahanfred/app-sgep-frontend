import type { NavGroup } from '@shared/models/nav.model';

export const AUDIENCE_NAV: NavGroup[] = [
  { label: 'Particulares', href: '/', children: [] },
  { label: 'Empresas', href: '/hazte-cliente', children: [] },
  { label: 'Autónomos', href: '/hazte-cliente', children: [] },
  { label: 'Banca Privada', href: '/inversion', children: [] },
  { label: 'Select', href: '/cuentas', children: [] },
];

export const MAIN_NAV = AUDIENCE_NAV;
