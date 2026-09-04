import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateGroupAssignment, CreateIndividualAssignment, ListAdminUsers, ListGroupAssignments, ListIndividualAssignments, ListMissionTypes, ListPrograms, ListPromotionMembers, ListPromotions, UpdateGroupAssignment, UpdateIndividualAssignment } from '@core/application';
import { TRAINING_ASSIGNMENT_WORKFLOW, type GroupMissionAssignmentWriteInput, type IndividualAssignmentCase, type IndividualMissionAssignmentWriteInput, type TrainingAssignmentStatus, type UserEntity } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiCalendar } from '@shared/components/ui-calendar/ui-calendar';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiSteps, type StepItem } from '@shared/components/ui-steps/ui-steps';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { firstValueFrom, forkJoin, type Observable } from 'rxjs';
import { individualCaseLabel, trainingAssignmentStatusLabel } from '../training-programming/training-programming.labels';

@Component({ selector: 'app-training-assignment-form-page', changeDetection: ChangeDetectionStrategy.OnPush, imports: [ReactiveFormsModule, Alert, Button, UiAvatar, UiCalendar, UiCheckbox, UiDatePicker, UiFormCard, UiInput, UiLoading, UiSelect, UiSteps], templateUrl: './training-assignment-form.page.html', styleUrl: './training-assignment-form.page.scss' })
export class TrainingAssignmentFormPage {
  private readonly destroyRef = inject(DestroyRef); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  private readonly listPromotions = inject(ListPromotions); private readonly listPrograms = inject(ListPrograms); private readonly listUsers = inject(ListAdminUsers); private readonly listMissions = inject(ListMissionTypes); private readonly listGroups = inject(ListGroupAssignments); private readonly listIndividuals = inject(ListIndividualAssignments); private readonly listMembers = inject(ListPromotionMembers); private readonly createGroup = inject(CreateGroupAssignment); private readonly updateGroup = inject(UpdateGroupAssignment); private readonly createIndividual = inject(CreateIndividualAssignment); private readonly updateIndividual = inject(UpdateIndividualAssignment); private readonly toast = inject(ToastService);
  readonly type = (this.route.snapshot.data['assignmentType'] as 'group' | 'individual') ?? 'group'; readonly isGroup = this.type === 'group'; readonly id = this.route.snapshot.paramMap.get('id'); readonly isView = this.route.snapshot.data['mode'] === 'view'; readonly loading = signal(!!this.id); readonly saving = signal(false); readonly error = signal<string | null>(null); readonly promotions = signal<ChoiceOption[]>([]); readonly programs = signal<ChoiceOption[]>([]); readonly users = signal<ChoiceOption[]>([]); readonly userEntities = signal<UserEntity[]>([]); readonly promotionMembers = signal<UserEntity[]>([]); readonly missions = signal<ChoiceOption[]>([]); readonly assignmentCase = signal<IndividualAssignmentCase>('pdi'); readonly workflow = signal<TrainingAssignmentStatus>('scheduled'); readonly leadQuery = new FormControl('', { nonNullable: true }); readonly leadSearch = signal(''); readonly listHref = '/catalogo/programacion-entrenamiento';
  readonly title = computed(() => this.isGroup ? (this.id ? 'Reprogramar asignación grupal' : 'Nueva asignación grupal') : (this.id ? 'Reprogramar asignación individual' : 'Nueva asignación individual')); readonly steps: StepItem[] = [{ label: 'Programa' }, { label: 'Promoción' }, { label: '2.1 Participantes' }, { label: 'Jefe de instrucción' }, { label: 'Fecha' }, { label: 'Vista previa' }]; readonly timelineStep = signal(this.route.snapshot.queryParamMap.get('step') === '2.1' ? 3 : 1); readonly currentStep = computed(() => this.isGroup ? this.timelineStep() : 1); readonly statusOptions: ChoiceOption[] = TRAINING_ASSIGNMENT_WORKFLOW.map((status) => ({ value: status, label: trainingAssignmentStatusLabel(status) })); readonly caseOptions: ChoiceOption[] = [{ value: 'pdi', label: 'PDI' }, { value: 'pde', label: 'PDE' }, { value: 'commission', label: 'Comisión' }]; readonly selectedParticipantIds = signal<string[]>([]); readonly pendingParticipants = computed(() => this.promotionMembers().filter((member) => !this.selectedParticipantIds().includes(member.id))); readonly leadCandidates = computed(() => this.userEntities().filter((user) => user.status === 'active').slice(0, 5).filter((user) => `${user.firstName} ${user.lastName} ${user.indicative ?? ''}`.toLowerCase().includes(this.leadSearch().trim().toLowerCase())));
  readonly form = new FormGroup({ promotionId: new FormControl('', { nonNullable: true, validators: Validators.required }), programId: new FormControl('', { nonNullable: true }), scheduledDate: new FormControl('', { nonNullable: true, validators: Validators.required }), trainingLeadId: new FormControl('', { nonNullable: true, validators: Validators.required }), studentId: new FormControl('', { nonNullable: true }), externalPerson: new FormControl('', { nonNullable: true }), missionId: new FormControl('', { nonNullable: true, validators: Validators.required }), instructorId: new FormControl('', { nonNullable: true }), date: new FormControl('', { nonNullable: true, validators: Validators.required }), status: new FormControl<TrainingAssignmentStatus>('scheduled', { nonNullable: true }) });
  readonly initialParticipantIds = signal<string[]>([]);
  readonly hasChanges = computed(() => this.form.dirty || JSON.stringify(this.selectedParticipantIds().slice().sort()) !== JSON.stringify(this.initialParticipantIds().slice().sort()));
  constructor() { this.leadQuery.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.leadSearch.set(value)); const id = this.id; forkJoin({ promotions: this.listPromotions.execute(), programs: this.listPrograms.execute(), users: this.listUsers.execute(), missions: this.listMissions.execute(), groups: this.listGroups.execute(), individuals: this.listIndividuals.execute() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: ({ promotions, programs, users, missions, groups, individuals }) => { this.promotions.set(promotions.map((item) => ({ value: item.id, label: item.name }))); this.programs.set(programs.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))); this.userEntities.set(users); this.users.set(users.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))); this.missions.set(missions.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))); if (id && this.isGroup) { const item = groups.find((entry) => entry.id === id); if (item) { this.form.patchValue({ promotionId: item.promotionId, programId: item.programId, scheduledDate: item.scheduledDate, trainingLeadId: item.trainingLeadId, status: item.status }); this.selectedParticipantIds.set(item.participantIds); this.workflow.set(item.status); this.onPromotionChange(item.promotionId); } } else if (id) { const item = individuals.find((entry) => entry.id === id); if (item) { this.form.patchValue({ studentId: item.studentId ?? '', externalPerson: item.externalPerson ?? '', programId: item.programId ?? '', missionId: item.missionId, instructorId: item.instructorId ?? '', date: item.date, status: item.status }); this.assignmentCase.set(item.assignmentCase); this.workflow.set(item.status); } } this.loading.set(false); }, error: () => { this.error.set('No hemos podido cargar los datos de programación.'); this.loading.set(false); } }); if (this.isView) this.form.disable({ emitEvent: false }); }
  changePromotion(value: string): void { this.selectedParticipantIds.set([]); this.initialParticipantIds.set([]); this.form.markAsDirty(); this.onPromotionChange(value); }
  onPromotionChange(value: string): void { this.form.controls.promotionId.setValue(value); this.listMembers.execute(value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((members) => { const ids = new Set(members.map((member) => member.userId)); this.promotionMembers.set(this.userEntities().filter((user) => ids.has(user.id))); }); }
  toggleParticipant(id: string, checked: boolean): void { this.selectedParticipantIds.update((ids) => checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id)); }
  previousStep(): void { this.timelineStep.update((step) => Math.max(1, step - 1)); }
  nextStep(): void {
    if (!this.isStepComplete()) {
      this.touchCurrentStep();
      return;
    }
    this.timelineStep.update((step) => Math.min(this.steps.length, step + 1));
  }
  isStepComplete(): boolean {
    if (this.timelineStep() === 1) return !!this.form.controls.programId.value;
    if (this.timelineStep() === 2) return !!this.form.controls.promotionId.value;
    if (this.timelineStep() === 3) return this.pendingParticipants().every((member) => this.selectedParticipantIds().includes(member.id));
    if (this.timelineStep() === 4) return !!this.form.controls.trainingLeadId.value;
    if (this.timelineStep() === 5) return !!this.form.controls.scheduledDate.value;
    return true;
  }
  private touchCurrentStep(): void {
    if (this.timelineStep() === 1) this.form.controls.programId.markAsTouched();
    if (this.timelineStep() === 2) this.form.controls.promotionId.markAsTouched();
    if (this.timelineStep() === 4) this.form.controls.trainingLeadId.markAsTouched();
    if (this.timelineStep() === 5) this.form.controls.scheduledDate.markAsTouched();
  }
  selectedProgram(): string { return this.programs().find((item) => item.value === this.form.controls.programId.value)?.label ?? 'Sin seleccionar'; }
  selectedPromotion(): string { return this.promotions().find((item) => item.value === this.form.controls.promotionId.value)?.label ?? 'Sin seleccionar'; }
  selectedLead(): string { return this.userEntities().find((item) => item.id === this.form.controls.trainingLeadId.value)?.firstName + ' ' + (this.userEntities().find((item) => item.id === this.form.controls.trainingLeadId.value)?.lastName ?? ''); }
  selectedDate(): string { const value = this.form.controls.scheduledDate.value; const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : 'Sin seleccionar'; }
  selectLead(id: string): void { if (!this.isView) this.form.controls.trainingLeadId.setValue(id); }
  setStatus(value: string): void { const status = value as TrainingAssignmentStatus; if (TRAINING_ASSIGNMENT_WORKFLOW.indexOf(status) >= TRAINING_ASSIGNMENT_WORKFLOW.indexOf(this.workflow())) { this.workflow.set(status); this.form.controls.status.setValue(status); } }
  setCase(value: string): void { this.assignmentCase.set(value as IndividualAssignmentCase); this.form.controls.programId.setValue(''); this.form.controls.externalPerson.setValue(''); }
  requiredError(control: FormControl): string | undefined { return control.touched && control.invalid ? 'Este campo es obligatorio.' : undefined; }
  optionValue(control: FormControl): string { return control.value as string; }
  async save(): Promise<void> { if (this.isView) return; this.error.set(null); if (this.isGroup) await this.saveGroup(); else await this.saveIndividual(); }
  private async saveGroup(): Promise<void> { if (this.form.controls.promotionId.invalid || !this.form.controls.programId.value || this.form.controls.scheduledDate.invalid || this.form.controls.trainingLeadId.invalid) { this.form.markAllAsTouched(); return; } const input: GroupMissionAssignmentWriteInput = { promotionId: this.form.controls.promotionId.value, programId: this.form.controls.programId.value, scheduledDate: this.form.controls.scheduledDate.value, trainingLeadId: this.form.controls.trainingLeadId.value, status: this.form.controls.status.value, participantIds: this.selectedParticipantIds() }; await this.persist(this.id ? this.updateGroup.execute(this.id, input) : this.createGroup.execute(input)); }
  private async saveIndividual(): Promise<void> { const student = this.assignmentCase() !== 'commission'; const program = this.assignmentCase() === 'pdi'; if ((student && this.form.controls.studentId.invalid) || (!student && this.form.controls.externalPerson.invalid) || (program && !this.form.controls.programId.value) || this.form.controls.missionId.invalid || this.form.controls.date.invalid) { this.form.markAllAsTouched(); return; } const input: IndividualMissionAssignmentWriteInput = { assignmentCase: this.assignmentCase(), studentId: student ? this.form.controls.studentId.value : null, externalPerson: student ? null : this.form.controls.externalPerson.value, programId: this.assignmentCase() === 'commission' ? null : this.form.controls.programId.value, missionId: this.form.controls.missionId.value, instructorId: this.assignmentCase() === 'commission' ? null : this.form.controls.instructorId.value || null, date: this.form.controls.date.value, status: this.form.controls.status.value }; await this.persist(this.id ? this.updateIndividual.execute(this.id, input) : this.createIndividual.execute(input)); }
  private async persist(request: Observable<unknown>): Promise<void> { this.saving.set(true); try { await firstValueFrom(request); this.toast.success('Programación guardada', 'La asignación ya está registrada.'); await this.router.navigate([this.listHref]); } catch (err: unknown) { const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la asignación.'; this.error.set(message); this.toast.error('No se pudo guardar', message); } finally { this.saving.set(false); } }
  caseText(): string { return individualCaseLabel(this.assignmentCase()); }
}
