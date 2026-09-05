import { describe, expect, it } from 'vitest';
import { activeNavGroupLabel, navGroupIsActive, navHrefMatchesPath, type NavGroup } from './nav.model';

const groups: NavGroup[] = [
  { label: 'Dashboard', href: '/', columns: [] },
  {
    label: 'Administración',
    columns: [
      {
        blocks: [
          {
            heading: 'Acceso',
            links: [{ label: 'Usuarios', href: '/catalogo/usuarios' }],
          },
        ],
      },
    ],
  },
  {
    label: 'Misiones',
    columns: [
      {
        blocks: [
          {
            heading: 'Vuelo',
            links: [{ label: 'Ejecución', href: '/catalogo/ejecucion-misiones' }],
          },
        ],
      },
    ],
  },
];

describe('nav.model', () => {
  it('marca Dashboard solo en la raíz', () => {
    expect(navGroupIsActive(groups[0]!, '/')).toBe(true);
    expect(navGroupIsActive(groups[0]!, '/catalogo/usuarios')).toBe(false);
  });

  it('resalta el primer grupo cuyo enlace coincide con la ruta', () => {
    expect(activeNavGroupLabel(groups, '/catalogo/usuarios')).toBe('Administración');
    expect(activeNavGroupLabel(groups, '/catalogo/usuarios/usr-1/editar')).toBe('Administración');
    expect(activeNavGroupLabel(groups, '/catalogo/ejecucion-misiones')).toBe('Misiones');
    expect(activeNavGroupLabel(groups, '/perfil')).toBeNull();
  });

  it('no trata cualquier ruta como la raíz', () => {
    expect(navHrefMatchesPath('/', '/catalogo/unidades')).toBe(false);
  });
});
