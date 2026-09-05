import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateGroupAssignment,
  EnrollInProgram,
  ListAdminUsers,
  ListGroupAssignments,
  ListIndividualAssignments,
  ListPrograms,
  ListPromotionMembers,
  ListPromotions,
  ListUserRoles,
  UpdateGroupAssignment,
  UpdateIndividualAssignment,
} from '@core/application';
import { isoCalendarDate } from '@core/application/use-cases/get-dashboard-overview';
import {
  TRAINING_ASSIGNMENT_WORKFLOW,
  type GroupMissionAssignmentWriteInput,
  type IndividualMissionAssignmentEntity,
  type IndividualMissionAssignmentWriteInput,
  type TrainingAssignmentStatus,
  type UserEntity,
} from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import {
  TRAINING_ASSIGNMENT_FORM_COPY,
  TRAINING_ASSIGNMENT_GROUP_STEPS,
} from '../../../constants/training-assignment-form.copy.constants';
import { enrollmentListUrl } from '../../../constants/enrollment.routes.constants';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiCalendar } from '@shared/components/ui-calendar/ui-calendar';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiSteps, type StepItem } from '@shared/components/ui-steps/ui-steps';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { firstValueFrom, forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import { trainingAssignmentStatusLabel } from '../training-programming/training-programming.labels';

@Component({
  selector: 'app-training-assignment-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    UiAvatar,
    UiCalendar,
    UiCheckbox,
    UiFormCard,
    UiInput,
    UiLoading,
    UiSelect,
    UiSteps,
  ],
  templateUrl: './training-assignment-form.page.html',
  styleUrl: './training-assignment-form.page.scss',
})
export class TrainingAssignmentFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPromotions = inject(ListPromotions);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listGroups = inject(ListGroupAssignments);
  private readonly listIndividuals = inject(ListIndividualAssignments);
  private readonly listMembers = inject(ListPromotionMembers);
  private readonly createGroup = inject(CreateGroupAssignment);
  private readonly updateGroup = inject(UpdateGroupAssignment);
  private readonly enrollInProgram = inject(EnrollInProgram);
  private readonly updateIndividual = inject(UpdateIndividualAssignment);
  private readonly toast = inject(ToastService);

  readonly copy = TRAINING_ASSIGNMENT_FORM_COPY;
  readonly type = (this.route.snapshot.data['assignmentType'] as 'group' | 'individual') ?? 'group';
  readonly isGroup = this.type === 'group';
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loading = signal(!!this.id);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly promotions = signal<ChoiceOption[]>([]);
  readonly programs = signal<ChoiceOption[]>([]);
  readonly userEntities = signal<UserEntity[]>([]);
  readonly promotionMembers = signal<UserEntity[]>([]);
  readonly studentsWithoutPromotion = signal<UserEntity[]>([]);
  readonly loadedIndividual = signal<IndividualMissionAssignmentEntity | null>(null);
  readonly workflow = signal<TrainingAssignmentStatus>('scheduled');
  readonly leadQuery = new FormControl('', { nonNullable: true });
  readonly leadSearch = signal('');
  readonly listHref = enrollmentListUrl(this.isGroup ? 'group' : 'individual');
  readonly title = computed(() => {
    if (this.isGroup) return this.id ? this.copy.groupEditTitle : this.copy.groupCreateTitle;
    return this.id ? this.copy.individualEditTitle : this.copy.individualCreateTitle;
  });
  readonly steps: StepItem[] = TRAINING_ASSIGNMENT_GROUP_STEPS.map((step) => ({ label: step.label }));
  readonly timelineStep = signal(1);
  readonly currentStep = computed(() => (this.isGroup ? this.timelineStep() : 1));
  readonly statusOptions: ChoiceOption[] = TRAINING_ASSIGNMENT_WORKFLOW.map((status) => ({
    value: status,
    label: trainingAssignmentStatusLabel(status),
  }));
  readonly studentOptions = computed<ChoiceOption[]>(() => {
    const currentId = this.form.controls.studentId.value;
    const people = [...this.studentsWithoutPromotion()];
    if (currentId && !people.some((user) => user.id === currentId)) {
      const current = this.userEntities().find((user) => user.id === currentId);
      if (current) people.unshift(current);
    }
    return people.map((user) => ({ value: user.id, label: this.displayName(user) }));
  });
  readonly selectedParticipantIds = signal<string[]>([]);
  readonly leadCandidates = computed(() =>
    this.userEntities()
      .filter((user) => user.status === 'active')
      .slice(0, 5)
      .filter((user) =>
        `${user.firstName} ${user.lastName} ${user.indicative ?? ''}`
          .toLowerCase()
          .includes(this.leadSearch().trim().toLowerCase()),
      ),
  );
  readonly form = new FormGroup({
    promotionId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    programId: new FormControl('', { nonNullable: true }),
    scheduledDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    trainingLeadId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    studentId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    status: new FormControl<TrainingAssignmentStatus>('scheduled', { nonNullable: true }),
  });
  readonly initialParticipantIds = signal<string[]>([]);
  readonly hasChanges = computed(
    () =>
      this.form.dirty ||
      JSON.stringify(this.selectedParticipantIds().slice().sort()) !==
        JSON.stringify(this.initialParticipantIds().slice().sort()),
  );

  constructor() {
    this.leadQuery.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.leadSearch.set(value));
    const id = this.id;
    forkJoin({
      promotions: this.listPromotions.execute(),
      programs: this.listPrograms.execute(),
      users: this.listUsers.execute(),
      roles: this.listRoles.execute(),
      groups: this.listGroups.execute(),
      individuals: this.listIndividuals.execute(),
    })
      .pipe(
        switchMap((data) => {
          if (!data.promotions.length) return of({ ...data, members: [] });
          return forkJoin(data.promotions.map((promotion) => this.listMembers.execute(promotion.id))).pipe(
            map((groups) => ({ ...data, members: groups.flat() })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ promotions, programs, users, roles, groups, individuals, members }) => {
          this.promotions.set(promotions.map((item) => ({ value: item.id, label: item.name })));
          this.programs.set(programs.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })));
          this.userEntities.set(users);
          const studentRoleIds = new Set(roles.filter((role) => role.code === 'PILOT').map((role) => role.id));
          const inPromotion = new Set(members.map((member) => member.userId));
          this.studentsWithoutPromotion.set(
            users.filter(
              (user) => user.roleIds.some((roleId) => studentRoleIds.has(roleId)) && !inPromotion.has(user.id),
            ),
          );
          if (id && this.isGroup) {
            const item = groups.find((entry) => entry.id === id);
            if (item) {
              this.form.patchValue({
                promotionId: item.promotionId,
                programId: item.programId,
                scheduledDate: item.scheduledDate,
                trainingLeadId: item.trainingLeadId,
                status: item.status,
              });
              this.selectedParticipantIds.set(item.participantIds);
              this.initialParticipantIds.set(item.participantIds);
              this.workflow.set(item.status);
              this.onPromotionChange(item.promotionId, false);
            }
          } else if (id) {
            const item = individuals.find((entry) => entry.id === id);
            if (item) {
              this.loadedIndividual.set(item);
              this.form.patchValue({
                studentId: item.studentId ?? '',
                programId: item.programId ?? '',
                status: item.status,
              });
              this.workflow.set(item.status);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.copy.loadError);
          this.loading.set(false);
        },
      });
    if (this.isView) this.form.disable({ emitEvent: false });
  }

  changePromotion(value: string): void {
    this.selectedParticipantIds.set([]);
    this.initialParticipantIds.set([]);
    this.form.markAsDirty();
    this.onPromotionChange(value, true);
  }

  onPromotionChange(value: string, selectAllWhenEmpty: boolean): void {
    this.form.controls.promotionId.setValue(value);
    this.listMembers
      .execute(value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((members) => {
        const ids = new Set(members.map((member) => member.userId));
        const people = this.userEntities().filter((user) => ids.has(user.id));
        this.promotionMembers.set(people);
        if (selectAllWhenEmpty && !this.selectedParticipantIds().length) {
          const next = people.map((user) => user.id);
          this.selectedParticipantIds.set(next);
          this.initialParticipantIds.set(next);
        }
      });
  }

  toggleParticipant(id: string, checked: boolean): void {
    this.selectedParticipantIds.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id),
    );
  }

  previousStep(): void {
    this.timelineStep.update((step) => Math.max(1, step - 1));
  }

  nextStep(): void {
    if (!this.isStepComplete()) {
      this.touchCurrentStep();
      return;
    }
    this.timelineStep.update((step) => Math.min(this.steps.length, step + 1));
  }

  isStepComplete(): boolean {
    if (this.timelineStep() === 1) return !!this.form.controls.programId.value;
    if (this.timelineStep() === 2)
      return !!this.form.controls.promotionId.value && this.selectedParticipantIds().length > 0;
    if (this.timelineStep() === 3) return !!this.form.controls.trainingLeadId.value;
    if (this.timelineStep() === 4) return !!this.form.controls.scheduledDate.value;
    return true;
  }

  selectedProgram(): string {
    return this.programs().find((item) => item.value === this.form.controls.programId.value)?.label ?? this.copy.unselected;
  }

  selectedPromotion(): string {
    return (
      this.promotions().find((item) => item.value === this.form.controls.promotionId.value)?.label ?? this.copy.unselected
    );
  }

  selectedLead(): string {
    const user = this.userEntities().find((item) => item.id === this.form.controls.trainingLeadId.value);
    return user ? `${user.firstName} ${user.lastName}`.trim() : this.copy.unselected;
  }

  selectedDate(): string {
    const value = this.form.controls.scheduledDate.value;
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : this.copy.unselected;
  }

  selectLead(id: string): void {
    if (!this.isView) this.form.controls.trainingLeadId.setValue(id);
  }

  setStatus(value: string): void {
    const status = value as TrainingAssignmentStatus;
    if (TRAINING_ASSIGNMENT_WORKFLOW.indexOf(status) >= TRAINING_ASSIGNMENT_WORKFLOW.indexOf(this.workflow())) {
      this.workflow.set(status);
      this.form.controls.status.setValue(status);
    }
  }

  requiredError(control: FormControl): string | undefined {
    return control.touched && control.invalid ? this.copy.required : undefined;
  }

  optionValue(control: FormControl): string {
    return control.value as string;
  }

  displayName(user: UserEntity): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  backToList(): void {
    void this.router.navigateByUrl(this.listHref);
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.isGroup) await this.saveGroup();
    else await this.saveIndividual();
  }

  private touchCurrentStep(): void {
    if (this.timelineStep() === 1) this.form.controls.programId.markAsTouched();
    if (this.timelineStep() === 2) this.form.controls.promotionId.markAsTouched();
    if (this.timelineStep() === 3) this.form.controls.trainingLeadId.markAsTouched();
    if (this.timelineStep() === 4) this.form.controls.scheduledDate.markAsTouched();
  }

  private async saveGroup(): Promise<void> {
    if (
      this.form.controls.promotionId.invalid ||
      !this.form.controls.programId.value ||
      this.form.controls.scheduledDate.invalid ||
      this.form.controls.trainingLeadId.invalid ||
      !this.selectedParticipantIds().length
    ) {
      this.form.markAllAsTouched();
      return;
    }
    const input: GroupMissionAssignmentWriteInput = {
      promotionId: this.form.controls.promotionId.value,
      programId: this.form.controls.programId.value,
      scheduledDate: this.form.controls.scheduledDate.value,
      trainingLeadId: this.form.controls.trainingLeadId.value,
      status: this.form.controls.status.value,
      participantIds: this.selectedParticipantIds(),
    };
    await this.persist(this.id ? this.updateGroup.execute(this.id, input) : this.createGroup.execute(input));
  }

  private async saveIndividual(): Promise<void> {
    if (this.form.controls.studentId.invalid || !this.form.controls.programId.value) {
      this.form.controls.studentId.markAsTouched();
      this.form.controls.programId.markAsTouched();
      return;
    }
    const loaded = this.loadedIndividual();
    if (this.id && loaded) {
      const input: IndividualMissionAssignmentWriteInput = {
        ...loaded,
        studentId: this.form.controls.studentId.value,
        programId: this.form.controls.programId.value,
        status: this.form.controls.status.value,
      };
      await this.persist(this.updateIndividual.execute(this.id, input));
      return;
    }
    await this.persist(
      this.enrollInProgram.execute({
        programId: this.form.controls.programId.value,
        source: 'individual',
        promotionId: null,
        userId: this.form.controls.studentId.value,
        enrolledAt: isoCalendarDate(),
      }),
    );
  }

  private async persist(request: Observable<unknown>): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(request);
      this.toast.success(this.copy.toastTitle, this.copy.toastBody);
      await this.router.navigateByUrl(this.listHref);
    } catch (err: unknown) {
      const message = err instanceof DomainError ? err.message : this.copy.persistError;
      this.error.set(message);
      this.toast.error(this.copy.toastError, message);
    } finally {
      this.saving.set(false);
    }
  }
}
