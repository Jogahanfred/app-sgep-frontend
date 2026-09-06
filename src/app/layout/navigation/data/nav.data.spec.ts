import { describe, expect, it } from 'vitest';
import { MAIN_NAV } from './nav.data';
import { NAV_ROUTES } from './nav-routes.constants';
import { flattenNavLinks } from '@shared/models/nav.model';

describe('MAIN_NAV', () => {
  it('no reutiliza la misma ruta con etiquetas distintas, salvo las vistas pendientes de tierra y simulador', () => {
    const links = MAIN_NAV.flatMap((group) => flattenNavLinks(group));
    const allowedDuplicates = new Set<string>([NAV_ROUTES.groundGrading, NAV_ROUTES.simulatorGrading]);
    const hrefs = links
      .filter((item) => !allowedDuplicates.has(item.href))
      .map((item) => item.href);
    expect(hrefs).toEqual([...new Set(hrefs)]);
    expect(links.some((item) => item.label === 'Ver calificaciones' && item.href === NAV_ROUTES.airGrades)).toBe(true);
  });

  it('expone cada pantalla real una sola vez y en el grupo que le corresponde', () => {
    const byLabel = Object.fromEntries(MAIN_NAV.map((group) => [group.label, flattenNavLinks(group).map((item) => item.href)]));
    expect(byLabel['Administración']).toEqual([
      NAV_ROUTES.users,
      NAV_ROUTES.roles,
      NAV_ROUTES.specialties,
      NAV_ROUTES.units,
      NAV_ROUTES.squadrons,
      NAV_ROUTES.commissions,
    ]);
    expect(byLabel['Catálogos']).toContain(NAV_ROUTES.standards);
    expect(byLabel['Catálogos']).toContain(NAV_ROUTES.phaseBanks);
    expect(byLabel['Catálogos']).toContain(NAV_ROUTES.aircraft);
    expect(byLabel['Programación']).toEqual([
      NAV_ROUTES.programs,
      NAV_ROUTES.promotions,
      NAV_ROUTES.enrollment,
      NAV_ROUTES.flightOrder,
      NAV_ROUTES.dispatch,
    ]);
    expect(byLabel['Calificaciones']).toEqual([
      NAV_ROUTES.groundGrading,
      NAV_ROUTES.groundGrading,
      NAV_ROUTES.missionExecution,
      NAV_ROUTES.airGrades,
      NAV_ROUTES.simulatorGrading,
      NAV_ROUTES.simulatorGrading,
      NAV_ROUTES.academicProgress,
    ]);
    expect(byLabel['Administración']).not.toContain(NAV_ROUTES.profile);
  });

  it('omite módulos que aún no existen', () => {
    const labels = MAIN_NAV.flatMap((group) => [group.label, ...flattenNavLinks(group).map((item) => item.label)]);
    expect(labels).not.toContain('Incidencias');
    expect(labels).not.toContain('Configuración General');
    expect(labels).not.toContain('Constructor curricular');
    expect(labels).not.toContain('Programación PDE');
    expect(labels).not.toContain('Programación y matrícula');
    expect(labels).not.toContain('Programación y asignación de misiones');
    expect(labels).not.toContain('Matricular promoción');
  });
});
