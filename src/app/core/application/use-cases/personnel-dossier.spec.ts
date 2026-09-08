import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD } from '../../domain/constants/evaluation-council.constants';
import { dossierSpecialtyAircraftArt } from '../../domain/services/personnel-dossier';
import { GetPersonnelDossier } from './get-personnel-dossier';
import { GetPersonnelDossierCurriculum } from './get-personnel-dossier-curriculum';
import { ListPersonnelDossiers } from './list-personnel-dossiers';

const adsys: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('legajo personal', () => {
  it('lista alumnos del contexto con horas de bitácora', async () => {
    const board = await firstValueFrom(new ListPersonnelDossiers(new MockAdminCatalogRepository()).execute(adsys));
    expect(board.needsSquadron).toBe(false);
    const sofia = board.rows.find((row) => row.userId === 'usr-sofia-vidal');
    expect(sofia?.gradeLabel).toBe('ALF');
    expect(sofia?.specialtyLabel).toBe('Pilotaje');
    expect(sofia?.lastName).toContain('Vidal');
    expect(sofia?.serial).toMatch(/^O-\d{5}-[ABO]+[+-]$/);
    expect(sofia?.expiresOn).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(sofia?.hours).toBeGreaterThan(0);
    expect(board.rows.some((row) => row.userId === 'usr-diego-molina')).toBe(true);
  });

  it('arma el expediente con bitácora y tope de consejo', async () => {
    const detail = await firstValueFrom(
      new GetPersonnelDossier(new MockAdminCatalogRepository()).execute(adsys, 'usr-diego-molina'),
    );
    expect(detail.documentNumber).toBe('81204567D');
    expect(detail.log.length).toBeGreaterThan(0);
    expect(detail.failedMissions).toBeGreaterThanOrEqual(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(detail.councilEligible).toBe(true);
    expect(detail.failThreshold).toBe(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(detail.photoUrl).toBe('/carnets/diego.jpg');
    expect(detail.programs.length).toBeGreaterThan(0);
  });

  it('elige el croquis de aeronave según especialidad y programa', async () => {
    expect(dossierSpecialtyAircraftArt(['Piloto de Transporte'])?.imageUrl).toBe('/aircraft/air-hercules.png');
    expect(dossierSpecialtyAircraftArt(['Piloto de Caza'])?.imageUrl).toBe('/aircraft/air-mirage2000.png');
    expect(dossierSpecialtyAircraftArt(['Piloto de Helicóptero'])?.imageUrl).toBe('/aircraft/air-enstrom.png');
    expect(dossierSpecialtyAircraftArt(['Piloto Alumno'])?.imageUrl).toBe('/aircraft/air-ch2000.png');
    expect(dossierSpecialtyAircraftArt(['Piloto Instructor'])?.imageUrl).toBe('/aircraft/air-kt1p.png');
    const repo = new MockAdminCatalogRepository();
    const sofia = await firstValueFrom(new GetPersonnelDossier(repo).execute(adsys, 'usr-sofia-vidal'));
    expect(sofia.specialtyAircraft?.imageUrl).toBe('/aircraft/air-enstrom.png');
    const ga510: OperationalContext = { ...adsys, unitId: 'unit-ga-51', squadronId: 'sq-510' };
    const fo = await firstValueFrom(new GetPersonnelDossier(repo).execute(ga510, 'usr-fo-510-ready'));
    expect(fo.specialtyAircraft?.imageUrl).toBe('/aircraft/air-ch2000.png');
    expect(fo.specialtyAircraft?.label).toBe('Piloto Alumno');
  });

  it('arma el expediente de un alumno FO con aeronave, folios e instructores', async () => {
    const ga510: OperationalContext = {
      ...adsys,
      unitId: 'unit-ga-51',
      squadronId: 'sq-510',
    };
    const detail = await firstValueFrom(
      new GetPersonnelDossier(new MockAdminCatalogRepository()).execute(ga510, 'usr-fo-510-ready'),
    );
    expect(detail.displayName).toContain('Mena');
    expect(detail.rankCode).toBe('ALF');
    expect(detail.log.length).toBeGreaterThan(0);
    expect(detail.folios.length).toBeGreaterThan(0);
    expect(detail.instructors.length).toBeGreaterThan(0);
    expect(detail.assignedAircraft?.registration).toBeTruthy();
  });

  it('arma el currículo de un programa con fases y misiones', async () => {
    const curriculum = await firstValueFrom(
      new GetPersonnelDossierCurriculum(new MockAdminCatalogRepository()).execute(adsys, 'usr-sofia-vidal', 'prg-heli-2023'),
    );
    expect(curriculum.programName).toContain('Helicóptero');
    expect(curriculum.phases.length).toBeGreaterThan(0);
    expect(curriculum.phases.some((phase) => phase.subphases.some((sub) => sub.missions.length > 0))).toBe(true);
  });
});
