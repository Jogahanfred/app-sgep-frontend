import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { ListPhaseBanks } from './list-phase-banks';
import { ListPhases } from './list-phases';
import { ListPrograms } from './list-programs';
import { ListSubphases } from './list-subphases';
import { SaveProgramCurriculum } from './save-program-curriculum';

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
