import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import {
  ListAdminUsers,
  ListGroupAssignments,
  ListIndividualAssignments,
  ListPrograms,
  ListPromotionMembers,
  ListPromotions,
  UpdateGroupAssignment,
  UpdateIndividualAssignment,
} from '@core/application';
import type {
  GroupMissionAssignmentEntity,
  IndividualMissionAssignmentEntity,
  ProgramEntity,
  PromotionEntity,
  UserEntity,
} from '@core/domain/entities';
import { TRAINING_PROGRAMMING_COPY } from '../../../constants/training-programming.copy.constants';
import {
  ENROLLMENT_LIST_TAB,
  ENROLLMENT_LIST_TAB_QUERY,
  enrollmentListTabFromQuery,
} from '../../../constants/enrollment.routes.constants';
import { trainingAssignmentStatusLabel } from './training-programming.labels';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { Modal } from '@shared/components/modal/modal';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTable, type UiTableColumn, type UiTableRow } from '@shared/components/ui-table/ui-table';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-training-programming-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Card, Modal, UiConfirmDialog, UiInput, UiSelect, UiTable],
  templateUrl: './training-programming.page.html',
  styleUrl: './training-programming.page.scss',
})
export class TrainingProgrammingPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly listGroups = inject(ListGroupAssignments);
  private readonly listIndividuals = inject(ListIndividualAssignments);
  private readonly listPromotions = inject(ListPromotions);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listPromotionMembers = inject(ListPromotionMembers);
  private readonly updateGroup = inject(UpdateGroupAssignment);
  private readonly updateIndividual = inject(UpdateIndividualAssignment);
  private readonly toast = inject(ToastService);

  readonly copy = TRAINING_PROGRAMMING_COPY;
  readonly tab = signal<'group' | 'individual'>('group');
  readonly groups = signal<GroupMissionAssignmentEntity[]>([]);
  readonly individuals = signal<IndividualMissionAssignmentEntity[]>([]);
  readonly promotions = signal<PromotionEntity[]>([]);
  readonly programs = signal<ProgramEntity[]>([]);
  readonly users = signal<UserEntity[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly programFilter = signal('all');
  readonly promotionFilter = signal('all');
  readonly cancelTarget = signal<{ kind: 'group' | 'individual'; id: string } | null>(null);
  readonly membersByPromotion = signal<Record<string, UserEntity[]>>({});
  readonly participantModal = signal<{ title: string; people: UserEntity[] } | null>(null);
  readonly participantColumns: UiTableColumn[] = [
    { id: 'name', header: TRAINING_PROGRAMMING_COPY.colName },
    { id: 'document', header: TRAINING_PROGRAMMING_COPY.colDocument },
    { id: 'indicative', header: TRAINING_PROGRAMMING_COPY.colIndicative },
    { id: 'email', header: TRAINING_PROGRAMMING_COPY.colEmail },
  ];
  readonly participantRows = computed<UiTableRow[]>(() =>
    (this.participantModal()?.people ?? []).map((user) => ({
      id: user.id,
      cells: {
        name: `${user.firstName} ${user.lastName}`.trim(),
        document: user.documentNumber,
        indicative: user.indicative ?? '—',
        email: user.email,
      },
    })),
  );

  readonly programOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: this.copy.programAll },
    ...this.programs().map((item) => ({ value: item.id, label: item.name })),
  ]);
  readonly promotionOptions = computed<ChoiceOption[]>(() => [
    { value: 'all', label: this.copy.promotionAll },
    ...this.promotions().map((item) => ({ value: item.id, label: item.name })),
  ]);
  readonly visibleGroups = computed(() =>
    this.groups().filter(
      (item) =>
        (this.programFilter() === 'all' || item.programId === this.programFilter()) &&
        (this.promotionFilter() === 'all' || item.promotionId === this.promotionFilter()) &&
        this.matches(this.groupText(item)),
    ),
  );
  readonly visibleIndividuals = computed(() =>
    this.individuals().filter(
      (item) =>
        (this.programFilter() === 'all' || item.programId === this.programFilter()) &&
        this.matches(`${this.personName(item)} ${this.programName(item.programId)}`),
    ),
  );
  readonly createLabel = computed(() =>
    this.tab() === 'group' ? this.copy.createGroup : this.copy.createIndividual,
  );

  statusText = trainingAssignmentStatusLabel;

  constructor() {
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = enrollmentListTabFromQuery(params.get(ENROLLMENT_LIST_TAB_QUERY));
      if (tab) this.tab.set(tab);
    });
    forkJoin({
      groups: this.listGroups.execute(),
      individuals: this.listIndividuals.execute(),
      promotions: this.listPromotions.execute(),
      programs: this.listPrograms.execute(),
      users: this.listUsers.execute(),
    })
      .pipe(
        switchMap((data) => {
          const promotionIds = [...new Set(data.groups.map((item) => item.promotionId))];
          if (!promotionIds.length) {
            return of({ ...data, members: {} as Record<string, UserEntity[]> });
          }
          return forkJoin(promotionIds.map((id) => this.listPromotionMembers.execute(id))).pipe(
            map((memberLists) => {
              const members: Record<string, UserEntity[]> = {};
              promotionIds.forEach((id, index) => {
                const ids = new Set(memberLists[index].map((member) => member.userId));
                members[id] = data.users.filter((user) => ids.has(user.id));
              });
              return { ...data, members };
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ groups, individuals, promotions, programs, users, members }) => {
        this.groups.set(groups);
        this.individuals.set(individuals);
        this.promotions.set(promotions);
        this.programs.set(programs);
        this.users.set(users);
        this.membersByPromotion.set(members);
      });
  }

  setTab(tab: 'group' | 'individual'): void {
    this.tab.set(tab);
    this.search.setValue('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [ENROLLMENT_LIST_TAB_QUERY]: ENROLLMENT_LIST_TAB[tab] },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  setFilter(filter: 'program' | 'promotion', value: string): void {
    if (filter === 'program') this.programFilter.set(value);
    if (filter === 'promotion') this.promotionFilter.set(value);
  }

  create(): void {
    void this.router.navigate([
      `/catalogo/programacion-entrenamiento/${this.tab() === 'group' ? 'grupal' : 'individual'}/nuevo`,
    ]);
  }

  promotionName(id: string): string {
    return this.promotions().find((item) => item.id === id)?.name ?? 'Sin promoción';
  }

  programName(id: string | null): string {
    return id ? (this.programs().find((item) => item.id === id)?.name ?? 'Sin programa') : 'Sin programa';
  }

  userName(id: string | null): string {
    if (!id) return '';
    const user = this.users().find((item) => item.id === id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : id;
  }

  personName(item: IndividualMissionAssignmentEntity): string {
    return item.externalPerson ?? this.userName(item.studentId);
  }

  enrolledPeople(item: GroupMissionAssignmentEntity): UserEntity[] {
    const byId = item.participantIds
      .map((id) => this.users().find((user) => user.id === id))
      .filter((user): user is UserEntity => !!user);
    if (byId.length) return byId;
    return this.membersByPromotion()[item.promotionId] ?? [];
  }

  participantNames(item: GroupMissionAssignmentEntity): string[] {
    return this.enrolledPeople(item).map((user) => `${user.firstName} ${user.lastName}`.trim());
  }

  openDetail(kind: 'group' | 'individual', id: string): void {
    void this.router.navigate([
      '/catalogo/programacion-entrenamiento',
      kind === 'group' ? 'grupal' : 'individual',
      id,
      'editar',
    ]);
  }

  viewParticipants(item: GroupMissionAssignmentEntity): void {
    this.participantModal.set({
      title: `${this.copy.participantsModalTitle} · ${this.promotionName(item.promotionId)}`,
      people: this.enrolledPeople(item),
    });
  }

  closeParticipants(): void {
    this.participantModal.set(null);
  }

  askCancel(kind: 'group' | 'individual', id: string): void {
    this.cancelTarget.set({ kind, id });
  }

  closeCancel(): void {
    this.cancelTarget.set(null);
  }

  confirmCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;
    if (target.kind === 'group') {
      const source = this.groups().find((item) => item.id === target.id);
      if (!source) return;
      this.updateGroup
        .execute(target.id, { ...source, status: 'cancelled', cancellationReason: 'Cancelada desde la matrícula.' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cancelled());
      return;
    }
    const source = this.individuals().find((item) => item.id === target.id);
    if (!source) return;
    this.updateIndividual
      .execute(target.id, { ...source, status: 'cancelled', cancellationReason: 'Cancelada desde la matrícula.' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cancelled());
  }

  statusClass(status: string): string {
    return status.replace('-', '_');
  }

  private cancelled(): void {
    this.toast.success('Matrícula cancelada', 'El estado ya está actualizado.');
    this.cancelTarget.set(null);
  }

  private groupText(item: GroupMissionAssignmentEntity): string {
    return `${this.promotionName(item.promotionId)} ${this.programName(item.programId)} ${this.participantNames(item).join(' ')}`;
  }

  private matches(value: string): boolean {
    return !this.query().trim() || value.toLowerCase().includes(this.query().trim().toLowerCase());
  }
}
