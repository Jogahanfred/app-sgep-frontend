import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { AcademicRecordAccessError, InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { GetAirGradeBoard } from './get-air-grade-board';
import { GetAirGradeSheet } from './get-air-grade-sheet';
import { RequestAirGradeObjection } from './request-air-grade-objection';
import { SignAirGradeMission } from './sign-air-grade-mission';

const norteAlfa: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

const sofiaPilot: OperationalContext = {
  userId: 'usr-sofia-vidal',
  displayName: 'Sofía Vidal Romero',
  roleCode: 'PILOT',
  assignedUnitId: 'unit-norte',
  assignedSquadronId: 'sq-alfa',
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('calificaciones de aire', () => {
  it('agrupa las misiones aéreas por programa, fase y subfase', async () => {
    const board = await firstValueFrom(
      new GetAirGradeBoard(new MockAdminCatalogRepository()).execute(norteAlfa, 'usr-sofia-vidal'),
    );
    expect(board.displayName).toContain('Sofía');
    expect(board.programs.length).toBeGreaterThan(0);
    const heli = board.programs.find((item) => item.programCode === 'PDI-HELI-2023');
    expect(heli).toBeTruthy();
    expect(heli?.phases.length).toBeGreaterThan(0);
    expect(heli?.phases.some((phase) => phase.subphases.some((subphase) => subphase.tiles.length > 0))).toBe(true);
    const clickable = heli?.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)).find((tile) => tile.clickable);
    expect(clickable?.executionId).toBeTruthy();
    expect(clickable?.code).toMatch(/^M\d+$/);
    expect(heli?.imageUrl).toBeTruthy();
    const tiles = heli?.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)) ?? [];
    expect(tiles.some((tile) => tile.average === 10 && tile.tone === 'fail')).toBe(true);
    expect(tiles.some((tile) => tile.average === 13 && tile.tone === 'regular')).toBe(true);
    expect(tiles.some((tile) => tile.tone === 'pending')).toBe(true);
  });

  it('expone un programa de demostración si el usuario de sesión no tiene expediente aéreo', async () => {
    const board = await firstValueFrom(
      new GetAirGradeBoard(new MockAdminCatalogRepository()).execute(norteAlfa, 'usr-elena-martin'),
    );
    expect(board.programs.length).toBeGreaterThan(0);
    expect(board.programs[0]?.imageUrl).toBeTruthy();
    expect(board.userId).toBe('usr-sofia-vidal');
  });

  it('recupera el expediente mock si el identificador de ruta viene corrupto', async () => {
    const board = await firstValueFrom(
      new GetAirGradeBoard(new MockAdminCatalogRepository()).execute(
        norteAlfa,
        'usr-sofia-vidal?programa=prg-heli-2023',
      ),
    );
    expect(board.programs.length).toBeGreaterThan(0);
    expect(board.userId).toBe('usr-sofia-vidal');
  });

  it('abre el detalle de una misión volada y permite firmar solo al alumno', async () => {
    const repo = new MockAdminCatalogRepository();
    const board = await firstValueFrom(new GetAirGradeBoard(repo).execute(sofiaPilot, 'usr-sofia-vidal'));
    const tile = board.programs
      .flatMap((program) => program.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)))
      .find((item) => item.clickable);
    expect(tile?.executionId).toBeTruthy();
    const sheet = await firstValueFrom(new GetAirGradeSheet(repo).execute(sofiaPilot, 'usr-sofia-vidal', tile!.executionId!));
    expect(sheet.missionName).toBe(tile!.missionName);
    expect(sheet.maneuvers.length).toBeGreaterThan(0);
    expect(sheet.canSignStudent).toBe(true);
    expect(sheet.pendingStudentSignature).toBe(true);
    expect(sheet.instructorSignature?.method).toBe('type');
    expect(sheet.instructorSignature?.value).toBeTruthy();
    expect(sheet.maneuvers.some((row) => row.expectedStandard !== undefined)).toBe(true);
    const cor = sheet.maneuvers.find((row) => row.corrected);
    expect(cor?.cause).toBeTruthy();
    expect(cor?.observation).toBeTruthy();
    expect(cor?.recommendation).toBeTruthy();

    const instructorSheet = await firstValueFrom(
      new GetAirGradeSheet(repo).execute(norteAlfa, 'usr-sofia-vidal', tile!.executionId!),
    );
    expect(instructorSheet.canSignStudent).toBe(false);

    await expect(
      firstValueFrom(new SignAirGradeMission(repo).execute(norteAlfa, tile!.executionId!, { method: 'type', value: 'Elena' })),
    ).rejects.toBeInstanceOf(AcademicRecordAccessError);

    const signed = await firstValueFrom(
      new SignAirGradeMission(repo).execute(sofiaPilot, tile!.executionId!, { method: 'type', value: 'Sofía Vidal Romero' }),
    );
    expect(signed.studentSignature?.signerUserId).toBe('usr-sofia-vidal');
    expect(signed.studentSignature?.method).toBe('type');
  });

  it('registra la inconformidad del alumno y deja de pedir firma', async () => {
    const repo = new MockAdminCatalogRepository();
    const board = await firstValueFrom(new GetAirGradeBoard(repo).execute(sofiaPilot, 'usr-sofia-vidal'));
    const tile = board.programs
      .flatMap((program) => program.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)))
      .find((item) => item.clickable);
    expect(tile?.executionId).toBeTruthy();

    await expect(
      firstValueFrom(new RequestAirGradeObjection(repo).execute(norteAlfa, tile!.executionId!)),
    ).rejects.toBeInstanceOf(AcademicRecordAccessError);

    const objected = await firstValueFrom(new RequestAirGradeObjection(repo).execute(sofiaPilot, tile!.executionId!));
    expect(objected.counselRequested).toBe(true);
    expect(objected.studentSignature).toBeFalsy();

    const sheet = await firstValueFrom(new GetAirGradeSheet(repo).execute(sofiaPilot, 'usr-sofia-vidal', tile!.executionId!));
    expect(sheet.counselRequested).toBe(true);
    expect(sheet.pendingStudentSignature).toBe(false);

    await expect(
      firstValueFrom(new SignAirGradeMission(repo).execute(sofiaPilot, tile!.executionId!, { method: 'type', value: 'Sofía' })),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});
