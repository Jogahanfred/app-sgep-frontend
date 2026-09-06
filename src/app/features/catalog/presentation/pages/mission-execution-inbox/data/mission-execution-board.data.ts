import type { MissionExecutionBoardItem, MissionExecutionBoardSnapshot } from '../types/mission-execution-board.types';

function slot(
  item: Omit<MissionExecutionBoardItem, 'order'> & { order: MissionExecutionBoardItem['order'] },
): MissionExecutionBoardItem {
  return item;
}

export const MISSION_EXECUTION_BOARD_SNAPSHOT: MissionExecutionBoardSnapshot = {
  operationDate: '05/09/2026',
  missions: [
    slot({
      id: 'slot-loc-adela',
      executionId: 'execution-dispatch-ready',
      code: 'LOC',
      mission: 'Misión local',
      student: 'Adela Mena López',
      studentCallsign: 'ALU-510-1',
      program: 'Piloto privado · ala fija',
      phase: 'Vuelo básico',
      subphase: 'Briefing',
      instructor: 'Tania Gil Rueda',
      instructorCallsign: 'INS-510',
      aircraft: 'EC-510A',
      time: '07:55',
      status: 'scheduled',
      progress: 12,
      progressLabel: '3 de 24 misiones',
      order: {
        number: 'OV-089',
        date: '05/09/2026',
        status: 'scheduled',
        aircraft: 'EC-510A',
        student: 'Adela Mena López',
        instructor: 'Tania Gil Rueda',
        authorizer: 'Elena Martín Ruiz',
        departure: '07:55',
        arrival: '09:10',
        duration: '1,2 h',
        observations: 'Slot de briefing local. La orden autoriza el despacho de la misión.',
      },
    }),
    slot({
      id: 'slot-nav-bruno',
      executionId: 'execution-dispatch-as-airborne',
      code: 'NAV',
      mission: 'Navegación',
      student: 'Bruno Roca Vidal',
      studentCallsign: 'ALU-510-2',
      program: 'Piloto privado · ala fija',
      phase: 'Navegación',
      subphase: 'Dual',
      instructor: 'Pablo Núñez Soto',
      instructorCallsign: 'INS-11',
      aircraft: 'EC-510B',
      time: '08:30',
      status: 'in-progress',
      progress: 38,
      progressLabel: '9 de 24 misiones',
      order: {
        number: 'OV-090',
        date: '05/09/2026',
        status: 'in-progress',
        aircraft: 'EC-510B',
        student: 'Bruno Roca Vidal',
        instructor: 'Pablo Núñez Soto',
        authorizer: 'Elena Martín Ruiz',
        departure: '08:30',
        arrival: '10:00',
        duration: '1,5 h',
        observations: 'Travesía dual en curso. Mantener el plan de combustible acordado en briefing.',
      },
    }),
    slot({
      id: 'slot-sim-clara',
      executionId: 'execution-dispatch-as-pending',
      code: 'SIM',
      mission: 'Procedimientos de cabina',
      student: 'Clara Sanz Prieto',
      studentCallsign: 'ALU-510-3',
      program: 'Piloto privado · ala fija',
      phase: 'Simulador',
      subphase: 'Simulador',
      instructor: 'Tania Gil Rueda',
      instructorCallsign: 'INS-510',
      aircraft: 'SIM-01',
      time: '10:00',
      status: 'scheduled',
      progress: 8,
      progressLabel: '2 de 24 misiones',
      order: {
        number: 'OV-091',
        date: '05/09/2026',
        status: 'draft',
        aircraft: 'SIM-01',
        student: 'Clara Sanz Prieto',
        instructor: 'Tania Gil Rueda',
        authorizer: 'Elena Martín Ruiz',
        departure: '10:00',
        arrival: '11:20',
        duration: '1,3 h',
        observations: 'Sesión de dispositivo. La orden queda como permiso de ocupación del simulador.',
      },
    }),
    slot({
      id: 'slot-rec-dario',
      executionId: 'execution-dispatch-as-pending-2',
      code: 'LOC',
      mission: 'Misión local · recuperación',
      student: 'Darío Vega Nieto',
      studentCallsign: 'ALU-510-4',
      program: 'Piloto privado · ala fija',
      phase: 'Vuelo básico',
      subphase: 'Dual',
      instructor: 'Pablo Núñez Soto',
      instructorCallsign: 'INS-11',
      aircraft: 'EC-510A',
      time: '11:30',
      status: 'scheduled',
      progress: 54,
      progressLabel: '13 de 24 misiones',
      order: {
        number: 'OV-094',
        date: '05/09/2026',
        status: 'scheduled',
        aircraft: 'EC-510A',
        student: 'Darío Vega Nieto',
        instructor: 'Pablo Núñez Soto',
        authorizer: 'Elena Martín Ruiz',
        departure: '11:30',
        arrival: '13:00',
        duration: '1,5 h',
        observations: 'Recuperación de aproximación. Repetir el circuito con instructor a bordo.',
      },
    }),
    slot({
      id: 'slot-cnt-diego',
      executionId: 'execution-dispatch-as-closed',
      code: 'CNT',
      mission: 'Contacto',
      student: 'Diego Molina',
      studentCallsign: 'ALU-221',
      program: 'Curso Piloto de Helicóptero',
      phase: 'Adaptación',
      subphase: 'Contacto',
      instructor: 'Pablo Núñez Soto',
      instructorCallsign: 'INS-11',
      aircraft: 'EC-HVA',
      time: '06:15',
      status: 'completed',
      progress: 100,
      progressLabel: 'Fase cerrada',
      order: {
        number: 'OV-081',
        date: '05/09/2026',
        status: 'completed',
        aircraft: 'EC-HVA',
        student: 'Diego Molina',
        instructor: 'Pablo Núñez Soto',
        authorizer: 'Elena Martín Ruiz',
        departure: '06:15',
        arrival: '07:25',
        duration: '1,2 h',
        observations: 'Misión cerrada. La orden queda como constancia del permiso ejecutado.',
      },
    }),
    slot({
      id: 'slot-can-natalia',
      executionId: 'execution-dispatch-as-closed-2',
      code: 'NAV',
      mission: 'Navegación',
      student: 'Natalia Rey Cubero',
      studentCallsign: 'ALU-314',
      program: 'Curso Piloto de Helicóptero',
      phase: 'Operaciones helitransportadas',
      subphase: 'Navegación',
      instructor: 'Tania Gil Rueda',
      instructorCallsign: 'INS-510',
      aircraft: 'EC-HVA',
      time: '14:00',
      status: 'cancelled',
      progress: 61,
      progressLabel: '14 de 23 misiones',
      order: {
        number: 'OV-096',
        date: '05/09/2026',
        status: 'cancelled',
        aircraft: 'EC-HVA',
        student: 'Natalia Rey Cubero',
        instructor: 'Tania Gil Rueda',
        authorizer: 'Elena Martín Ruiz',
        departure: '14:00',
        arrival: '15:30',
        duration: '1,5 h',
        observations: 'Cancelada por aeronave fuera de servicio. No autoriza ejecución.',
      },
    }),
  ],
};

export const MISSION_EXECUTION_TODAY_ISO = '2026-09-05';

function isoToEs(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function closePastDay(
  date: string,
  missions: readonly MissionExecutionBoardItem[],
): MissionExecutionBoardItem[] {
  return missions.map((item) => {
    const status = item.status === 'scheduled' || item.status === 'in-progress' ? 'completed' : item.status;
    return {
      ...item,
      id: `${item.id}-${date}`,
      executionId: item.executionId,
      status,
      progress: status === 'completed' ? 100 : item.progress,
      progressLabel: status === 'completed' ? 'Fase cerrada' : item.progressLabel,
      order: {
        ...item.order,
        date,
        status: status === 'cancelled' ? 'cancelled' : 'completed',
      },
    };
  });
}

const MISSION_EXECUTION_YESTERDAY: MissionExecutionBoardSnapshot = {
  operationDate: '04/09/2026',
  missions: closePastDay('04/09/2026', MISSION_EXECUTION_BOARD_SNAPSHOT.missions),
};

const MISSION_EXECUTION_BOARDS: Record<string, MissionExecutionBoardSnapshot> = {
  [MISSION_EXECUTION_TODAY_ISO]: MISSION_EXECUTION_BOARD_SNAPSHOT,
  '2026-09-04': MISSION_EXECUTION_YESTERDAY,
};

export function missionExecutionBoardForDate(iso: string): MissionExecutionBoardSnapshot {
  return (
    MISSION_EXECUTION_BOARDS[iso] ?? {
      operationDate: isoToEs(iso),
      missions: [],
    }
  );
}
