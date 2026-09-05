import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { HELICOPTER_COURSE_ID } from '../../adapters/mock/helicopter-course.data';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { PROGRAM_CULMINATED_MESSAGE } from '../../domain/services/admin-catalog';
import { GetDailyDispatchBoard } from './get-daily-dispatch-board';
import { GetFlightOrderBoard } from './get-flight-order-board';
import { IssueFlightOrder } from './issue-flight-order';

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

describe('IssueFlightOrder', () => {
  it('crea la asignación y la ejecución programada para el despacho diario', async () => {
    const repo = new MockAdminCatalogRepository();
    const board = await firstValueFrom(new GetFlightOrderBoard(repo).execute(norteAlfa));
    const trainee = board.trainees.find(
      (item) => !item.programCulminated && item.status === 'ready' && item.nextMissionId,
    );
    expect(trainee).toBeTruthy();
    const issued = await firstValueFrom(
      new IssueFlightOrder(repo).execute(norteAlfa, {
        studentId: trainee!.userId,
        programId: trainee!.programId,
        missionId: trainee!.nextMissionId!,
        instructorId: board.instructors[0].id,
        aircraftId: board.aircraft[0].id,
        date: board.operationDate,
        scheduledTime: '09:15',
      }),
    );
    expect(issued.assignment.status).toBe('scheduled');
    expect(issued.execution.status).toBe('scheduled');
    expect(issued.execution.startTime).toBe('09:15');
    expect(issued.execution.aircraftId).toBe(board.aircraft[0].id);
    expect(trainee!.programCulminated).toBe(false);
    const dispatch = await firstValueFrom(
      new GetDailyDispatchBoard(repo).execute(norteAlfa, board.operationDate),
    );
    const slot = dispatch.slots.find((item) => item.assignmentId === issued.assignment.id);
    expect(slot?.aircraftId).toBe(board.aircraft[0].id);
    expect(slot?.startTime).toBe('09:15');
    expect(slot?.instructorId).toBe(board.instructors[0].id);
  });

  it('no modifica el curso de helicóptero culminado', async () => {
    const repo = new MockAdminCatalogRepository();
    const board = await firstValueFrom(new GetFlightOrderBoard(repo).execute(norteAlfa));
    const trainee = board.trainees.find((item) => item.programId === HELICOPTER_COURSE_ID && item.nextMissionId);
    expect(trainee).toBeTruthy();
    await expect(
      firstValueFrom(
        new IssueFlightOrder(repo).execute(norteAlfa, {
          studentId: trainee!.userId,
          programId: trainee!.programId,
          missionId: trainee!.nextMissionId!,
          instructorId: board.instructors[0].id,
          aircraftId: board.aircraft[0].id,
          date: board.operationDate,
          scheduledTime: '09:15',
        }),
      ),
    ).rejects.toMatchObject({ message: PROGRAM_CULMINATED_MESSAGE });
  });

  it('rechaza al piloto', async () => {
    await expect(
      firstValueFrom(
        new IssueFlightOrder(new MockAdminCatalogRepository()).execute(
          { ...norteAlfa, roleCode: 'PILOT' },
          {
            studentId: 'usr-silvia-rueda-paz',
            programId: 'prg-ir',
            missionId: 'mt-ir-1',
            instructorId: 'usr-pablo-nunez',
            aircraftId: 'ac-hva',
            date: '2026-09-05',
            scheduledTime: '08:30',
          },
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});
