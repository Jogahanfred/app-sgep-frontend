import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreatePhaseBank } from './create-phase-bank';
import { CreateSubphaseBank } from './create-subphase-bank';
import { ListPhaseBanks } from './list-phase-banks';
import { ListPhases } from './list-phases';
import { ListPrograms } from './list-programs';
import { ListSubphaseBanks } from './list-subphase-banks';
import { ListSubphases } from './list-subphases';
import { SaveProgramCurriculum } from './save-program-curriculum';
import { UpdatePhaseBank } from './update-phase-bank';

describe('formación académica', () => {
  it('lista los programas de la academia', async () => {
    const items = await firstValueFrom(new ListPrograms(new MockAdminCatalogRepository()).execute());
    expect(items.map((item) => item.code)).toEqual(['PPL-AF', 'IR-ME', 'CPL-AF']);
  });

  it('carga el itinerario PPL con fases y subfases', async () => {
    const repo = new MockAdminCatalogRepository();
    const phases = (await firstValueFrom(new ListPhases(repo).execute())).filter((item) => item.programId === 'prg-ppl');
    const subphases = await firstValueFrom(new ListSubphases(repo).execute());
    expect(phases).toHaveLength(5);
    expect(subphases.filter((item) => phases.some((phase) => phase.id === item.phaseId)).length).toBeGreaterThan(3);
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
