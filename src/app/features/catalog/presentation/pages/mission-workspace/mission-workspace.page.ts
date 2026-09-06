import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin, merge } from 'rxjs';
import {
  GetMissionExecution,
  ListAdminUsers,
  ListAircraft,
  ListIndividualAssignments,
  ListManeuvers,
  ListMissionExecutions,
  ListMissionTypes,
  ListPhases,
  ListSubphases,
  UpdateMissionExecution,
} from '@core/application';
import type {
  DirbeLevel,
  IndividualMissionAssignmentEntity,
  ManeuverBankEntity,
  ManeuverGrade,
  MissionExecutionEntity,
  MissionExecutionWriteInput,
  MissionResult,
  MissionSignature,
  PhaseEntity,
  SubphaseEntity,
  UserEntity,
} from '@core/domain/entities';
import { dirbeLevelDelta, dirbepGradeChipClass, formatDirbeLevelDelta } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { catalogMissionKey } from '@core/domain/services/admin-catalog';
import { canSignMissionPad, type MissionSignPad } from '@core/domain/services/mission-execution-signature';
import {
  MISSION_GRADE_SCALE,
  missionHasDangerousGrade,
  missionManeuverAverage,
  missionResultFromManeuverGrades,
} from '@core/domain/services/mission-execution-grade';
import { Accordion } from '@shared/components/accordion/accordion';
import { AccordionItem } from '@shared/components/accordion/accordion-item';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Icon } from '@shared/components/icon/icon';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { Modal } from '@shared/components/modal/modal';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ClientSession } from '@layout/client-session.service';
import { MISSION_WORKSPACE_COPY, MISSION_WORKSPACE_INBOX } from './mission-workspace.copy.constants';
import { MissionSignatureDialog, type MissionSignatureDraft } from './mission-signature-dialog';
import { FLIGHT_INCIDENT_ROUTES } from '../../../constants/flight-incident.copy.constants';

interface EvaluationRow {
  maneuver: ManeuverBankEntity;
  grade: ManeuverGrade | null;
  expectedStandard: DirbeLevel | null;
  observation: string;
  cause: string;
  recommendation: string;
  corrected: boolean;
  evidenceName: string | null;
}

interface HistoryChip {
  id: string;
  code: string;
  score: string;
  current: boolean;
}

interface NoteFields {
  cause: FormControl<string>;
  observation: FormControl<string>;
  recommendation: FormControl<string>;
}

interface NoteSnapshot {
  cause: string;
  observation: string;
  recommendation: string;
}

@Component({
  selector: 'app-mission-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Accordion,
    AccordionItem,
    Alert,
    Button,
    Card,
    Icon,
    UiAvatar,
    UiInput,
    UiLoading,
    UiSelect,
    UiTextarea,
    MissionSignatureDialog,
    Modal,
  ],
  templateUrl: './mission-workspace.page.html',
  styleUrl: './mission-workspace.page.scss',
})
export class MissionWorkspacePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getExecution = inject(GetMissionExecution);
  private readonly updateExecution = inject(UpdateMissionExecution);
  private readonly listExecutions = inject(ListMissionExecutions);
  private readonly listAssignments = inject(ListIndividualAssignments);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listMissions = inject(ListMissionTypes);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly listAircraft = inject(ListAircraft);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);
  private readonly toast = inject(ToastService);
  private readonly session = inject(ClientSession);

  readonly copy = MISSION_WORKSPACE_COPY;
  readonly inboxHref = MISSION_WORKSPACE_INBOX;

  incidentHref(): string {
    const id = this.execution()?.id;
    return id ? FLIGHT_INCIDENT_ROUTES.fromExecution(id, true) : this.inboxHref;
  }

  openIncidentPrompt(): void {
    this.reportPromptOpen.set(true);
  }

  closeIncidentPrompt(): void {
    this.reportPromptOpen.set(false);
  }

  continueIncidentReport(): void {
    this.reportPromptOpen.set(false);
    void this.router.navigateByUrl(this.incidentHref());
  }

  async postponeMission(): Promise<void> {
    this.reportPromptOpen.set(false);
    this.clearFilledMissionData();
    await this.save('completed', MISSION_WORKSPACE_COPY.postponed, MISSION_WORKSPACE_COPY.postponedLead);
  }

  private clearFilledMissionData(): void {
    this.rows.update((rows) =>
      rows.map((row) => ({
        ...row,
        grade: null,
        observation: '',
        cause: '',
        recommendation: '',
        corrected: false,
        evidenceName: null,
      })),
    );
    for (const fields of this.noteFields.values()) {
      fields.cause.setValue('');
      fields.observation.setValue('');
      fields.recommendation.setValue('');
    }
    this.savedNotes.clear();
    this.form.patchValue({
      takeoffTime: '',
      landingTime: '',
      executedHours: 0,
      observations: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      result: null,
    });
    this.instructorSignature.set(null);
    this.studentSignature.set(null);
    this.counselRequested.set(false);
  }
  readonly gradeScale = MISSION_GRADE_SCALE;
  readonly resultOptions: ChoiceOption[] = [
    { value: 'approved', label: MISSION_WORKSPACE_COPY.results.approved },
    { value: 'approved-observations', label: MISSION_WORKSPACE_COPY.results['approved-observations'] },
    { value: 'reinforcement', label: MISSION_WORKSPACE_COPY.results.reinforcement },
    { value: 'failed', label: MISSION_WORKSPACE_COPY.results.failed },
  ];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly savingNotesId = signal<string | null>(null);
  readonly notesTick = signal(0);
  readonly error = signal<string | null>(null);
  readonly execution = signal<MissionExecutionEntity | null>(null);
  readonly assignment = signal<IndividualMissionAssignmentEntity | null>(null);
  readonly users = signal<UserEntity[]>([]);
  readonly missionName = signal('');
  readonly missionCode = signal('');
  readonly aircraftLabel = signal('');
  readonly history = signal<HistoryChip[]>([]);
  readonly rows = signal<EvaluationRow[]>([]);
  readonly instructorSignature = signal<MissionSignature | null>(null);
  readonly studentSignature = signal<MissionSignature | null>(null);
  readonly counselRequested = signal(false);
  readonly signingPad = signal<MissionSignPad | null>(null);
  readonly reportPromptOpen = signal(false);
  private readonly noteFields = new Map<string, NoteFields>();
  private readonly savedNotes = new Map<string, NoteSnapshot>();

  readonly form = new FormGroup({
    startDate: new FormControl('', { nonNullable: true }),
    startTime: new FormControl('', { nonNullable: true }),
    takeoffTime: new FormControl('', { nonNullable: true }),
    landingTime: new FormControl('', { nonNullable: true }),
    executedHours: new FormControl(0, { nonNullable: true, validators: [Validators.min(0.01)] }),
    aircraftId: new FormControl('', { nonNullable: true }),
    observations: new FormControl('', { nonNullable: true }),
    strengths: new FormControl('', { nonNullable: true }),
    improvements: new FormControl('', { nonNullable: true }),
    recommendations: new FormControl('', { nonNullable: true }),
    result: new FormControl<MissionResult | null>(null),
  });

  readonly evaluatedCount = computed(() => this.rows().filter((row) => row.grade).length);
  readonly average = computed(() => missionManeuverAverage(this.rows().map((row) => row.grade)));
  readonly failedByDangerous = computed(() => missionHasDangerousGrade(this.rows().map((row) => row.grade)));
  readonly resultLabel = computed(() => {
    const result = this.form.controls.result.value;
    return result ? MISSION_WORKSPACE_COPY.results[result] : MISSION_WORKSPACE_COPY.pending;
  });
  readonly canClose = computed(() => {
    const ready =
      this.evaluatedCount() === this.rows().length && this.rows().length > 0 && this.form.controls.executedHours.value > 0;
    return ready && !!this.instructorSignature() && !!this.studentSignature();
  });
  readonly failedMission = computed(
    () => this.failedByDangerous() || this.form.controls.result.value === 'failed',
  );
  readonly canSignInstructor = computed(() =>
    canSignMissionPad(
      'instructor',
      { userId: this.session.userId(), roleCode: this.session.roleCode() },
      this.assignment(),
    ),
  );
  readonly canSignStudent = computed(() =>
    canSignMissionPad(
      'student',
      { userId: this.session.userId(), roleCode: this.session.roleCode() },
      this.assignment(),
    ),
  );
  readonly signingTitle = computed(() =>
    this.signingPad() === 'student' ? MISSION_WORKSPACE_COPY.signStudent : MISSION_WORKSPACE_COPY.signInstructor,
  );
  readonly signingDefaultName = computed(() =>
    this.signingPad() === 'student' ? this.studentName() : this.instructorName(),
  );
  readonly studentName = computed(() => this.personName(this.assignment()?.studentId ?? null));
  readonly instructorName = computed(() => this.personName(this.assignment()?.instructorId ?? null));
  readonly phaseLabel = computed(() => {
    const status = this.execution()?.status ?? 'scheduled';
    return MISSION_WORKSPACE_COPY.phase[status];
  });
  readonly dateLabel = computed(() => this.formatDate(this.execution()?.startDate ?? this.form.controls.startDate.value));
  readonly hoursLabel = computed(() => {
    const hours = this.form.controls.executedHours.value;
    return hours > 0 ? `${hours} ${MISSION_WORKSPACE_COPY.hoursSuffix}` : MISSION_WORKSPACE_COPY.none;
  });
  readonly scoreLabel = computed(() => {
    const average = this.average();
    return average === null ? MISSION_WORKSPACE_COPY.none : String(average).replace('.', ',');
  });
  readonly scoreWidth = computed(() => {
    const average = this.average();
    return average === null ? '0%' : `${Math.min(100, (average / 20) * 100)}%`;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set(MISSION_WORKSPACE_COPY.loadError);
      this.loading.set(false);
      return;
    }
    forkJoin({
      execution: this.getExecution.execute(id),
      executions: this.listExecutions.execute(),
      assignments: this.listAssignments.execute(),
      users: this.listUsers.execute(),
      missions: this.listMissions.execute(),
      maneuvers: this.listManeuvers.execute(),
      aircraft: this.listAircraft.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ execution, executions, assignments, users, missions, maneuvers, aircraft, phases, subphases }) => {
          const assignment = assignments.find((item) => item.id === execution.individualAssignmentId) ?? null;
          const mission = missions.find((item) => item.id === assignment?.missionId);
          const plane = aircraft.find((item) => item.id === execution.aircraftId);
          this.execution.set(execution);
          this.assignment.set(assignment);
          this.users.set(users);
          this.missionName.set(mission?.name ?? assignment?.missionId ?? '');
          this.missionCode.set(mission?.code ?? '');
          this.aircraftLabel.set(plane?.registration ?? MISSION_WORKSPACE_COPY.none);
          this.form.patchValue({
            startDate: execution.startDate ?? '',
            startTime: execution.startTime ?? '',
            takeoffTime: execution.takeoffTime,
            landingTime: execution.landingTime,
            executedHours: execution.executedHours,
            aircraftId: execution.aircraftId ?? '',
            observations: execution.observations,
            strengths: execution.strengths,
            improvements: execution.improvements,
            recommendations: execution.recommendations,
            result: execution.result,
          });
          const nextRows = execution.evaluations.map((evaluation) => ({
            maneuver:
              maneuvers.find((item) => item.id === evaluation.maneuverId) ?? {
                id: evaluation.maneuverId,
                code: evaluation.maneuverId,
                name: 'Maniobra',
                description: '',
                  operationId: '',
                },
              grade: evaluation.grade,
              expectedStandard: this.expectedStandard(
                assignment?.programId ?? null,
                assignment?.missionId,
                evaluation.maneuverId,
                phases,
                subphases,
              ),
            observation: evaluation.observation,
            cause: evaluation.cause ?? '',
            recommendation: evaluation.recommendation ?? '',
            corrected: evaluation.corrected ?? false,
            evidenceName: evaluation.evidenceName,
          }));
          this.rows.set(nextRows);
          this.bindNoteFields(nextRows);
          this.instructorSignature.set(execution.instructorSignature ?? null);
          this.studentSignature.set(execution.studentSignature ?? null);
          this.counselRequested.set(execution.counselRequested ?? false);
          this.history.set(this.buildHistory(execution, executions, assignments, missions));
          this.syncResultFromGrades();
          this.loading.set(false);
        },
        error: () => {
          this.error.set(MISSION_WORKSPACE_COPY.loadError);
          this.loading.set(false);
        },
      });
  }

  gradeChipClass(grade: string | null | undefined, selected = false): string {
    return dirbepGradeChipClass(grade, selected);
  }

  gradeDelta(row: EvaluationRow): number {
    return dirbeLevelDelta(row.expectedStandard, row.grade);
  }

  gradeDeltaLabel(row: EvaluationRow): string {
    return formatDirbeLevelDelta(this.gradeDelta(row));
  }

  gradeTitle(grade: ManeuverGrade): string {
    return MISSION_WORKSPACE_COPY.grades[grade as keyof typeof MISSION_WORKSPACE_COPY.grades] ?? grade;
  }

  notesOf(id: string): NoteFields {
    const notes = this.noteFields.get(id);
    if (!notes) {
      throw new Error(`Missing note fields for ${id}`);
    }
    return notes;
  }

  hasPendingNotes(id: string): boolean {
    this.notesTick();
    const notes = this.noteFields.get(id);
    const saved = this.savedNotes.get(id);
    if (!notes || !saved) return false;
    const hasData = Boolean(notes.cause.value.trim() || notes.observation.value.trim() || notes.recommendation.value.trim());
    const dirty =
      notes.cause.value !== saved.cause ||
      notes.observation.value !== saved.observation ||
      notes.recommendation.value !== saved.recommendation;
    return hasData && dirty;
  }

  showCor(id: string): boolean {
    const row = this.rows().find((item) => item.maneuver.id === id);
    return Boolean(row?.corrected) && !this.hasPendingNotes(id);
  }

  setGrade(id: string, value: ManeuverGrade): void {
    this.rows.update((rows) => rows.map((row) => (row.maneuver.id === id ? { ...row, grade: value } : row)));
    this.syncResultFromGrades();
  }

  async saveNotes(id: string): Promise<void> {
    if (!this.hasPendingNotes(id)) return;
    const previous = this.rows().find((row) => row.maneuver.id === id)?.corrected ?? false;
    this.flushNotesIntoRows();
    this.rows.update((rows) =>
      rows.map((row) => (row.maneuver.id === id ? { ...row, corrected: true } : row)),
    );
    this.savingNotesId.set(id);
    await this.save(this.execution()?.status ?? 'scheduled', MISSION_WORKSPACE_COPY.notesSaved);
    if (this.error()) {
      this.rows.update((rows) =>
        rows.map((row) => (row.maneuver.id === id ? { ...row, corrected: previous } : row)),
      );
    } else {
      this.snapshotNotes(id);
    }
    this.savingNotesId.set(null);
  }

  setResult(value: string): void {
    if (this.failedByDangerous()) return;
    this.form.controls.result.setValue((value || null) as MissionResult | null);
  }

  async start(): Promise<void> {
    const current = this.execution();
    if (!current || current.status !== 'scheduled') return;
    const now = new Date();
    this.form.controls.startDate.setValue(now.toISOString().slice(0, 10));
    this.form.controls.startTime.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    await this.save('in-progress', MISSION_WORKSPACE_COPY.started);
  }

  openSignature(pad: MissionSignPad): void {
    if (pad === 'instructor' && !this.canSignInstructor()) return;
    if (pad === 'student' && !this.canSignStudent()) return;
    this.signingPad.set(pad);
  }

  closeSignature(): void {
    this.signingPad.set(null);
  }

  applySignature(draft: MissionSignatureDraft): void {
    const pad = this.signingPad();
    const userId = this.session.userId();
    if (!pad || !userId) return;
    if (pad === 'instructor' && !this.canSignInstructor()) return;
    if (pad === 'student' && !this.canSignStudent()) return;
    const signature: MissionSignature = {
      signerUserId: userId,
      signerName: this.session.displayName(),
      signedAt: new Date().toISOString(),
      method: draft.method,
      value: draft.value,
    };
    if (pad === 'instructor') this.instructorSignature.set(signature);
    else this.studentSignature.set(signature);
    this.signingPad.set(null);
    void this.save(this.execution()?.status ?? 'scheduled', MISSION_WORKSPACE_COPY.signatureApplied);
  }

  async requestCounsel(): Promise<void> {
    if (!this.failedMission()) return;
    this.counselRequested.set(true);
    await this.save(this.execution()?.status ?? 'scheduled', MISSION_WORKSPACE_COPY.counselSaved);
  }

  async close(): Promise<void> {
    if (!this.canClose()) {
      this.error.set(MISSION_WORKSPACE_COPY.closeError);
      return;
    }
    await this.save('completed', MISSION_WORKSPACE_COPY.closed);
  }

  async save(
    status = this.execution()?.status ?? 'scheduled',
    message: string = MISSION_WORKSPACE_COPY.saved,
    lead = 'La misión ya está actualizada.',
  ): Promise<void> {
    const current = this.execution();
    if (!current) return;
    this.flushNotesIntoRows();
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    const input: MissionExecutionWriteInput = {
      status,
      startDate: value.startDate || null,
      startTime: value.startTime || null,
      takeoffTime: value.takeoffTime,
      landingTime: value.landingTime,
      executedHours: value.executedHours,
      aircraftId: value.aircraftId || null,
      observations: value.observations,
      strengths: value.strengths,
      improvements: value.improvements,
      recommendations: value.recommendations,
      result: value.result,
      instructorSignature: this.instructorSignature(),
      studentSignature: this.studentSignature(),
      counselRequested: this.counselRequested(),
      evaluations: this.rows().map((row) => ({
        id: `evaluation-${row.maneuver.id}`,
        maneuverId: row.maneuver.id,
        grade: row.grade,
        observation: row.observation,
        evidenceName: row.evidenceName,
        cause: row.cause,
        recommendation: row.recommendation,
        corrected: row.corrected,
      })),
    };
    try {
      const updated = await firstValueFrom(this.updateExecution.execute(current.id, input));
      this.execution.set(updated);
      this.instructorSignature.set(updated.instructorSignature ?? this.instructorSignature());
      this.studentSignature.set(updated.studentSignature ?? this.studentSignature());
      this.counselRequested.set(updated.counselRequested ?? this.counselRequested());
      this.toast.success(message, lead);
      if (status === 'completed') await this.router.navigateByUrl(MISSION_WORKSPACE_INBOX);
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : MISSION_WORKSPACE_COPY.saveError);
    } finally {
      this.saving.set(false);
    }
  }

  private expectedStandard(
    programId: string | null,
    missionId: string | undefined,
    maneuverId: string,
    phases: readonly PhaseEntity[],
    subphases: readonly SubphaseEntity[],
  ): DirbeLevel | null {
    if (!missionId) return null;
    const missionKey = catalogMissionKey(missionId);
    const phaseIds = new Set(phases.filter((phase) => phase.programId === programId).map((phase) => phase.id));
    const pool = programId ? subphases.filter((item) => phaseIds.has(item.phaseId)) : subphases;
    const ranked = [...pool].sort((left, right) => {
      const leftAir = phases.find((phase) => phase.id === left.phaseId)?.moduleKind === 'air' ? 0 : 1;
      const rightAir = phases.find((phase) => phase.id === right.phaseId)?.moduleKind === 'air' ? 0 : 1;
      return leftAir - rightAir;
    });
    for (const subphase of ranked) {
      const cell = subphase.standardAssignments.find(
        (item) => item.missionKey === missionKey && item.maneuverId === maneuverId,
      );
      if (cell?.dirbeLevel) return cell.dirbeLevel;
    }
    return null;
  }

  private bindNoteFields(rows: EvaluationRow[]): void {
    this.noteFields.clear();
    this.savedNotes.clear();
    for (const row of rows) {
      const notes: NoteFields = {
        cause: new FormControl(row.cause, { nonNullable: true }),
        observation: new FormControl(row.observation, { nonNullable: true }),
        recommendation: new FormControl(row.recommendation, { nonNullable: true }),
      };
      merge(notes.cause.valueChanges, notes.observation.valueChanges, notes.recommendation.valueChanges)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.notesTick.update((count) => count + 1));
      this.noteFields.set(row.maneuver.id, notes);
      this.savedNotes.set(row.maneuver.id, {
        cause: row.cause,
        observation: row.observation,
        recommendation: row.recommendation,
      });
    }
  }

  private flushNotesIntoRows(): void {
    this.rows.update((rows) =>
      rows.map((row) => {
        const notes = this.noteFields.get(row.maneuver.id);
        if (!notes) return row;
        return {
          ...row,
          cause: notes.cause.value,
          observation: notes.observation.value,
          recommendation: notes.recommendation.value,
        };
      }),
    );
  }

  private snapshotNotes(id: string): void {
    const notes = this.noteFields.get(id);
    if (!notes) return;
    this.savedNotes.set(id, {
      cause: notes.cause.value,
      observation: notes.observation.value,
      recommendation: notes.recommendation.value,
    });
    this.notesTick.update((count) => count + 1);
  }

  private syncResultFromGrades(): void {
    const next = missionResultFromManeuverGrades(
      this.rows().map((row) => row.grade),
      this.form.controls.result.value,
    );
    this.form.controls.result.setValue(next);
  }

  private personName(userId: string | null): string {
    if (!userId) return MISSION_WORKSPACE_COPY.none;
    const user = this.users().find((item) => item.id === userId);
    return user ? `${user.firstName} ${user.lastName}`.trim() : userId;
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return MISSION_WORKSPACE_COPY.none;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  private buildHistory(
    current: MissionExecutionEntity,
    executions: MissionExecutionEntity[],
    assignments: IndividualMissionAssignmentEntity[],
    missions: { id: string; code: string }[],
  ): HistoryChip[] {
    const studentId = assignments.find((item) => item.id === current.individualAssignmentId)?.studentId;
    if (!studentId) return [];
    return executions
      .filter((item) => {
        const assignment = assignments.find((entry) => entry.id === item.individualAssignmentId);
        return assignment?.studentId === studentId && (item.status === 'completed' || item.id === current.id);
      })
      .slice(0, 6)
      .map((item) => {
        const assignment = assignments.find((entry) => entry.id === item.individualAssignmentId);
        const mission = missions.find((entry) => entry.id === assignment?.missionId);
        const score = missionManeuverAverage(item.evaluations.map((evaluation) => evaluation.grade));
        return {
          id: item.id,
          code: mission?.code ?? item.id,
          score: score === null ? MISSION_WORKSPACE_COPY.none : String(score).replace('.', ','),
          current: item.id === current.id,
        };
      });
  }
}
