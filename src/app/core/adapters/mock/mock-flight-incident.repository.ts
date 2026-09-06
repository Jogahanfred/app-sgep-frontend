import { Observable } from 'rxjs';
import type {
  FlightIncidentActionInput,
  FlightIncidentEntity,
  FlightIncidentWriteInput,
} from '../../domain/entities/flight-incident';
import type { FlightIncidentRepository } from '../../ports/flight-incident.repository';
import { asMockStream } from './observable-of';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function seedIncidents(): FlightIncidentEntity[] {
  const year = new Date().getFullYear();
  const today = isoDateOffset(0);
  const yesterday = isoDateOffset(-1);
  return [
    {
      id: 'inc-0421',
      folio: `INC-${year}-0421`,
      executionId: 'execution-dispatch-ready',
      missionId: 'mt-local',
      aircraftId: 'ac-hvd',
      detectedAt: `${today} 13:15`,
      sector: 'Zona norte',
      phase: 'enroute',
      incidentType: 'maintenance',
      severity: 'aog',
      summary: 'Vibración anómala en mandos de cola',
      ataCode: 'ATA-27',
      instrumentReading: '',
      caution: '',
      description:
        'Vibración excesiva en pedales tras virajes escarpados en zona de instrucción. Se interrumpió la sesión.',
      crewAction: 'Aeronave dejada en tierra para inspección de mandos y transmisión de cola.',
      evidenceName: null,
      declared: true,
      status: 'submitted',
      workshopNote: '',
    },
    {
      id: 'inc-0420',
      folio: `INC-${year}-0420`,
      executionId: 'execution-dispatch-as-closed-2',
      missionId: 'mt-local',
      aircraftId: 'ac-hvb',
      detectedAt: `${today} 11:40`,
      sector: 'Circuito local',
      phase: 'approach',
      incidentType: 'maintenance',
      severity: 'mel',
      summary: 'Fluctuación de temperatura en indicación de motor',
      ataCode: 'ATA-71',
      instrumentReading: '',
      caution: '',
      description: 'Indicación de temperatura irregular durante la desaceleración en tramo básico.',
      crewAction: 'Se completó el circuito y se reportó para inspección de planta motriz.',
      evidenceName: null,
      declared: true,
      status: 'submitted',
      workshopNote: '',
    },
    {
      id: 'inc-0419',
      folio: `INC-${year}-0419`,
      executionId: 'execution-dispatch-as-closed',
      missionId: 'mt-ifr',
      aircraftId: 'ac-hva',
      detectedAt: `${today} 08:20`,
      sector: 'Tramo de espera',
      phase: 'preflight',
      incidentType: 'maintenance',
      severity: 'routine',
      summary: 'Aviso intermitente de filtro de combustible en prechequeo',
      ataCode: 'ATA-00',
      instrumentReading: '',
      caution: '',
      description: 'Luz de aviso de filtro parpadea en el prechequeo. Se revisó y quedó operativa.',
      crewAction: 'Inspección de línea y verificación de indicación; aeronave liberada.',
      evidenceName: null,
      declared: true,
      status: 'submitted',
      workshopNote: '',
    },
    {
      id: 'inc-0418',
      folio: `INC-${year}-0418`,
      executionId: 'execution-dispatch-as-airborne',
      missionId: 'mt-nav',
      aircraftId: 'ac-hvh',
      detectedAt: `${yesterday} 17:50`,
      sector: 'Ruta visual',
      phase: 'enroute',
      incidentType: 'operational',
      severity: 'mel',
      summary: 'Estática pronunciada en radio VHF-2',
      ataCode: 'ATA-24',
      instrumentReading: '',
      caution: '',
      description: 'Comunicaciones con estática en VHF-2. VHF-1 permanece usable.',
      crewAction: 'Se operó con el equipo principal y se abrió discrepancia diferible.',
      evidenceName: null,
      declared: true,
      status: 'submitted',
      workshopNote: '',
    },
  ];
}

export class MockFlightIncidentRepository implements FlightIncidentRepository {
  private items: FlightIncidentEntity[] = seedIncidents();
  private seq = 422;

  list(): Observable<readonly FlightIncidentEntity[]> {
    return asMockStream(this.items.map((item) => ({ ...item })));
  }

  create(input: FlightIncidentWriteInput): Observable<FlightIncidentEntity> {
    const year = new Date().getFullYear();
    const item: FlightIncidentEntity = {
      id: `inc-${this.seq}`,
      folio: `INC-${year}-${String(this.seq).padStart(4, '0')}`,
      workshopNote: '',
      ...input,
    };
    this.seq += 1;
    this.items = [item, ...this.items];
    return asMockStream({ ...item });
  }

  getById(id: string): Observable<FlightIncidentEntity | null> {
    const item = this.items.find((row) => row.id === id) ?? null;
    return asMockStream(item ? { ...item } : null);
  }

  takeAction(id: string, input: FlightIncidentActionInput): Observable<FlightIncidentEntity> {
    const current = this.items.find((row) => row.id === id);
    if (!current) {
      throw new Error('Incidencia no encontrada');
    }
    const severity =
      input.outcome === 'resolved' ? 'routine' : input.outcome === 'deferred' ? 'mel' : 'aog';
    const item: FlightIncidentEntity = {
      ...current,
      crewAction: input.crewAction,
      workshopNote: input.workshopNote,
      severity,
      status: 'submitted',
    };
    this.items = this.items.map((row) => (row.id === id ? item : row));
    return asMockStream({ ...item });
  }
}
