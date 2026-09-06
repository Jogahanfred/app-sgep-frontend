import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { HELICOPTER_SOURCE_SUMMARY } from '../../adapters/mock/helicopter-program.data';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { catalogMissionKey } from '../../domain/services/admin-catalog';
import { CreatePhaseBank } from './create-phase-bank';
import { CreateSubphaseBank } from './create-subphase-bank';
import { ListPhaseBanks } from './list-phase-banks';
import { ListPhases } from './list-phases';
import { ListMissionTypes } from './list-mission-types';
import { ListPrograms } from './list-programs';
import { ListSubphaseBanks } from './list-subphase-banks';
import { ListSubphases } from './list-subphases';
import { AssignProgramStandards } from './assign-program-standards';
import { SaveProgramStandardMatrix } from './save-program-standard-matrix';
import { SaveProgramCurriculum } from './save-program-curriculum';
import { UpdatePhaseBank } from './update-phase-bank';

describe('formación académica', () => {
  it('lista los programas de la academia', async () => {
    const items = await firstValueFrom(new ListPrograms(new MockAdminCatalogRepository()).execute());
    expect(items.map((item) => item.code)).toEqual(['PDI-HELI-2023', 'PPL-AF', 'IR-ME', 'CPL-AF']);
    expect(items.find((item) => item.id === 'prg-ppl')?.standardIds).toEqual(['std-toff', 'std-land']);
  });

  it('asigna estándares a un programa guardado', async () => {
    const repo = new MockAdminCatalogRepository();
    const updated = await firstValueFrom(new AssignProgramStandards(repo).execute('prg-cpl', ['std-crm']));
    expect(updated.standardIds).toEqual(['std-crm']);
    const listed = await firstValueFrom(new ListPrograms(repo).execute());
    expect(listed.find((item) => item.id === 'prg-cpl')?.standardIds).toEqual(['std-crm']);
  });

  it('guarda el nivel DIRBE por cruce de misión y maniobra', async () => {
    const repo = new MockAdminCatalogRepository();
    const updated = await firstValueFrom(
      new SaveProgramStandardMatrix(repo).execute('prg-cpl', {
        subphases: [
          {
            subphaseId: 'sp-cpl-nav',
            assignments: [
              {
                missionKey: catalogMissionKey('mt-nav'),
                maneuverId: 'man-toff',
                standardIds: ['std-crm'],
                dirbeLevel: 'R',
              },
              {
                missionKey: catalogMissionKey('mt-nav'),
                maneuverId: 'man-land',
                standardIds: [],
                dirbeLevel: 'B',
              },
            ],
          },
        ],
      }),
    );
    expect(updated.standardIds).toEqual(['std-crm']);
    const subphases = await firstValueFrom(new ListSubphases(repo).execute());
    expect(subphases.find((item) => item.id === 'sp-cpl-nav')?.standardAssignments).toEqual([
      {
        missionKey: catalogMissionKey('mt-nav'),
        maneuverId: 'man-toff',
        standardIds: ['std-crm'],
        dirbeLevel: 'R',
      },
      {
        missionKey: catalogMissionKey('mt-nav'),
        maneuverId: 'man-land',
        standardIds: [],
        dirbeLevel: 'B',
      },
    ]);
  });

  it('carga el itinerario PPL con fases y subfases', async () => {
    const repo = new MockAdminCatalogRepository();
    const phases = (await firstValueFrom(new ListPhases(repo).execute())).filter((item) => item.programId === 'prg-ppl');
    const subphases = await firstValueFrom(new ListSubphases(repo).execute());
    expect(phases).toHaveLength(6);
    expect(subphases.filter((item) => phases.some((phase) => phase.id === item.phaseId)).length).toBeGreaterThan(3);
  });

  it('carga el programa de helicóptero completo para ejecutar el módulo', async () => {
    const repo = new MockAdminCatalogRepository();
    const programs = await firstValueFrom(new ListPrograms(repo).execute());
    const program = programs.find((item) => item.id === 'prg-heli-2023');
    const phases = (await firstValueFrom(new ListPhases(repo).execute()))
      .filter((item) => item.programId === program?.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const allSubphases = await firstValueFrom(new ListSubphases(repo).execute());
    const banks = await firstValueFrom(new ListSubphaseBanks(repo).execute());
    const missionTypes = await firstValueFrom(new ListMissionTypes(repo).execute());
    const missionTypeById = new Map(missionTypes.map((item) => [item.id, item] as const));
    const phaseIds = new Set(phases.map((item) => item.id));
    const subphases = allSubphases.filter((item) => phaseIds.has(item.phaseId));
    const airPhases = phases.filter((item) => item.moduleKind === 'air');
    const groundPhases = phases.filter((item) => item.moduleKind === 'ground');
    const simPhases = phases.filter((item) => item.moduleKind === 'simulator');
    const simSubphases = subphases.filter((item) => simPhases.some((phase) => phase.id === item.phaseId));
    const airSubphases = subphases.filter((item) => airPhases.some((phase) => phase.id === item.phaseId));
    const groundSubphases = subphases.filter((item) => groundPhases.some((phase) => phase.id === item.phaseId));
    const aeroBank = banks.find((item) => item.id === 'sb-heli-aero');
    const doctrineBank = banks.find((item) => item.id === 'sb-heli-doctrine');

    expect(program).toMatchObject({
      code: 'PDI-HELI-2023',
      name: 'Curso Piloto de Helicóptero',
      programType: 'HELI',
      status: 'active',
      academicYear: 2025,
      lifecycleFlag: 'culminated',
    });
    expect(program?.groundPeriodicExams?.length).toBeGreaterThan(0);
    expect(program?.groundPeriodicExams?.some((item) => item.period === 'Inopinado')).toBe(true);
    expect(groundPhases).toHaveLength(3);
    expect(simPhases).toHaveLength(1);
    expect(airPhases).toHaveLength(5);
    expect(groundSubphases).toHaveLength(HELICOPTER_SOURCE_SUMMARY.groundSubjectCount);
    expect(simSubphases).toHaveLength(3);
    expect(airSubphases).toHaveLength(16);
    expect(groundSubphases.reduce((total, item) => total + item.hours, 0)).toBe(
      HELICOPTER_SOURCE_SUMMARY.groundAcademicHours,
    );
    expect(airSubphases.reduce((total, item) => total + item.hours, 0)).toBe(
      HELICOPTER_SOURCE_SUMMARY.totalFlightHours,
    );
    expect(airSubphases.reduce((total, item) => total + item.missionTypeIds.length, 0)).toBe(
      HELICOPTER_SOURCE_SUMMARY.loadedMissionCount,
    );
    expect(simSubphases.reduce((total, item) => total + item.hours, 0)).toBe(
      HELICOPTER_SOURCE_SUMMARY.simulatorHours,
    );
    expect(simSubphases.reduce((total, item) => total + item.missionTypeIds.length, 0)).toBe(
      HELICOPTER_SOURCE_SUMMARY.simulatorMissionCount,
    );
    expect(
      groundPhases.map((phase) =>
        groundSubphases
          .filter((item) => item.phaseId === phase.id)
          .reduce((total, item) => total + item.hours, 0),
      ),
    ).toEqual([189, 34, 33.5]);
    expect(
      airPhases.map((phase) =>
        airSubphases
          .filter((item) => item.phaseId === phase.id)
          .reduce((total, item) => total + item.hours, 0),
      ),
    ).toEqual([51, 40, 22, 2, 5]);
    expect(aeroBank).toMatchObject({ coefficient: 0.13, minPassingGrade: 16 });
    expect(doctrineBank).toMatchObject({ coefficient: 0.22, minPassingGrade: 18 });
    const nightMissionIds = airSubphases.find((item) => item.id === 'sp-heli-night')?.missionTypeIds ?? [];
    expect(nightMissionIds.map((id) => missionTypeById.get(id)?.code)).toEqual([
      'N-1',
      'N-2',
      'N-3',
      'N-4',
      'N-5',
      'N-6',
      'N-7',
    ]);
    const operationsOrderMissionIds =
      subphases.find((item) => item.id === 'sp-heli-operations-order')?.missionTypeIds ?? [];
    expect(operationsOrderMissionIds.map((id) => missionTypeById.get(id)?.code)).toEqual([
      'O/O-1',
      'O/O-2',
    ]);
    expect(
      subphases.every(
        (item) => item.standardAssignments.length === item.missionTypeIds.length * item.maneuverIds.length,
      ),
    ).toBe(true);
    expect(subphases.every((item) => item.standardAssignments.every((cell) => cell.dirbeLevel))).toBe(true);
    expect(
      [...new Set(subphases.flatMap((item) => item.standardAssignments.map((cell) => cell.dirbeLevel)))].sort(),
    ).toEqual(['B', 'D', 'I', 'R']);
  });

  it('crea un plan de estudios y rechaza horas inválidas', async () => {
    const repo = new MockAdminCatalogRepository();
    const banks = await firstValueFrom(new ListPhaseBanks(repo).execute());
    const created = await firstValueFrom(
      new SaveProgramCurriculum(repo).execute({
        program: {
          code: 'fi-01',
          name: 'Instructor de vuelo',
          programType: 'FI',
          description: 'Formación de instructores.',
          status: 'active',
        },
        phases: [
          {
            phaseBankId: banks[0].id,
            sortOrder: 1,
            subphases: [
              {
                subphaseBankId: 'sb-aula',
                hours: 12,
                missionMode: 'automatic',
                missionTypeIds: [],
                customMissionNames: [],
                autoMissionCode: 'CER',
                autoMissionCount: 17,
                maneuverIds: [],
                sortOrder: 1,
              },
            ],
          },
        ],
      }),
    );
    expect(created.code).toBe('FI-01');
    expect(created.programType).toBe('FI');
    expect(created.imageUrl).toBe('/programs/fi.jpg');
    const createdPhases = (await firstValueFrom(new ListPhases(repo).execute())).filter(
      (item) => item.programId === created.id,
    );
    const createdSubs = (await firstValueFrom(new ListSubphases(repo).execute())).filter((item) =>
      createdPhases.some((phase) => phase.id === item.phaseId),
    );
    expect(createdSubs[0].missionMode).toBe('automatic');
    expect(createdSubs[0].autoMissionCode).toBe('CER');
    expect(createdSubs[0].autoMissionCount).toBe(17);
    expect(createdSubs[0].maneuverOperationIds).toEqual([]);
    expect(createdSubs[0].maneuverAssignment).toEqual({});
    expect(createdSubs[0].standardAssignments).toEqual([]);

    await expect(
      firstValueFrom(
        new SaveProgramCurriculum(repo).execute({
          program: {
            code: 'BAD',
            name: 'Inválido',
            programType: 'PPL',
            description: '',
            status: 'active',
          },
          phases: [
            {
              phaseBankId: banks[0].id,
              sortOrder: 1,
              subphases: [
                {
                  subphaseBankId: 'sb-aula',
                  hours: 0,
                  missionMode: 'manual',
                  missionTypeIds: [],
                  customMissionNames: [],
                  autoMissionCode: '',
                  autoMissionCount: 0,
                  maneuverIds: [],
                  sortOrder: 1,
                },
              ],
            },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('crea y actualiza el banco de fases fuera del programa', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreatePhaseBank(repo).execute({
        code: 'adv',
        name: 'Avanzada',
        description: 'Maniobras avanzadas.',
        status: 'active',
      }),
    );
    expect(created.code).toBe('ADV');
    const updated = await firstValueFrom(
      new UpdatePhaseBank(repo).execute(created.id, {
        code: 'ADV',
        name: 'Fase avanzada',
        description: 'Maniobras avanzadas.',
        status: 'inactive',
      }),
    );
    expect(updated.name).toBe('Fase avanzada');
    expect(updated.status).toBe('inactive');
    const banks = await firstValueFrom(new ListPhaseBanks(repo).execute());
    expect(banks.some((item) => item.id === created.id && item.name === 'Fase avanzada')).toBe(true);
  });

  it('crea un banco de subfase y rechaza un código duplicado', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateSubphaseBank(repo).execute({
        code: 'line',
        name: 'Línea',
        description: 'Vuelo en línea.',
        status: 'active',
      }),
    );
    expect(created.code).toBe('LINE');
    const withGrade = await firstValueFrom(
      new CreateSubphaseBank(repo).execute({
        code: 'aero-x',
        name: 'Aerodinámica extra',
        description: 'Asignatura de tierra.',
        status: 'active',
        coefficient: 0.13,
        minPassingGrade: 16,
      }),
    );
    expect(withGrade).toMatchObject({ coefficient: 0.13, minPassingGrade: 16 });
    const banks = await firstValueFrom(new ListSubphaseBanks(repo).execute());
    expect(banks.some((item) => item.id === created.id)).toBe(true);
    await expect(
      firstValueFrom(
        new CreatePhaseBank(repo).execute({
          code: 'TEO',
          name: 'Duplicado',
          description: '',
          status: 'active',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('exige al menos una subfase por fase', async () => {
    await expect(
      firstValueFrom(
        new SaveProgramCurriculum(new MockAdminCatalogRepository()).execute({
          program: {
            code: 'VACIO',
            name: 'Sin etapas',
            programType: 'PPL',
            description: '',
            status: 'active',
          },
          phases: [{ phaseBankId: 'pb-teo', sortOrder: 1, subphases: [] }],
        }),
      ),
    ).rejects.toThrow(/subfase/);
  });
});
