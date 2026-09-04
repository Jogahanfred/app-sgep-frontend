import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListGroupAssignments, ListIndividualAssignments, ListPromotions, ListPrograms, ListAdminUsers, ListMissionTypes, ListPromotionMembers, UpdateGroupAssignment, UpdateIndividualAssignment } from '@core/application';
import type { GroupMissionAssignmentEntity, IndividualMissionAssignmentEntity, ProgramEntity, PromotionEntity, UserEntity, MissionTypeEntity, TrainingAssignmentStatus } from '@core/domain/entities';
import { UpperCasePipe } from '@angular/common';
import { trainingAssignmentStatusLabel, individualCaseLabel } from './training-programming.labels';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiConfirmDialog } from '@shared/components/ui-confirm-dialog/ui-confirm-dialog';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({ selector: 'app-training-programming-page', changeDetection: ChangeDetectionStrategy.OnPush, imports: [ReactiveFormsModule, UpperCasePipe, Button, Card, UiConfirmDialog, UiInput, UiSelect], templateUrl: './training-programming.page.html', styleUrl: './training-programming.page.scss' })
export class TrainingProgrammingPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listGroups = inject(ListGroupAssignments);
  private readonly listIndividuals = inject(ListIndividualAssignments);
  private readonly listPromotions = inject(ListPromotions);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listMissions = inject(ListMissionTypes);
  private readonly listPromotionMembers = inject(ListPromotionMembers);
  private readonly updateGroup = inject(UpdateGroupAssignment);
  private readonly updateIndividual = inject(UpdateIndividualAssignment);
  private readonly toast = inject(ToastService);
  readonly tab = signal<'group' | 'individual'>('group');
  readonly groups = signal<GroupMissionAssignmentEntity[]>([]);
  readonly individuals = signal<IndividualMissionAssignmentEntity[]>([]);
  readonly promotions = signal<PromotionEntity[]>([]);
  readonly programs = signal<ProgramEntity[]>([]);
  readonly users = signal<UserEntity[]>([]);
  readonly missions = signal<MissionTypeEntity[]>([]);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly statusFilter = signal<'all' | IndividualMissionAssignmentEntity['status']>('all');
  readonly programFilter = signal('all');
  readonly promotionFilter = signal('all');
  readonly instructorFilter = signal('all');
  readonly cancelTarget = signal<{ kind: 'group' | 'individual'; id: string } | null>(null);
  readonly pendingParticipants = signal<Record<string, number>>({});
  readonly statusOptions: ChoiceOption[] = [{ value: 'all', label: 'Todos' }, { value: 'scheduled', label: 'Programado' }, { value: 'assigned', label: 'Asignado' }, { value: 'in-progress', label: 'En curso' }, { value: 'completed', label: 'Completado' }, { value: 'cancelled', label: 'Cancelado' }];
  readonly programOptions = computed<ChoiceOption[]>(() => [{ value: 'all', label: 'Todos los programas' }, ...this.programs().map((item) => ({ value: item.id, label: item.name }))]);
  readonly promotionOptions = computed<ChoiceOption[]>(() => [{ value: 'all', label: 'Todas las promociones' }, ...this.promotions().map((item) => ({ value: item.id, label: item.name }))]);
  readonly instructorOptions = computed<ChoiceOption[]>(() => [{ value: 'all', label: 'Todos los instructores' }, ...this.users().map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))]);
  readonly visibleGroups = computed(() => this.groups().filter((item) => this.statusMatches(item.status) && (this.programFilter() === 'all' || item.programId === this.programFilter()) && (this.promotionFilter() === 'all' || item.promotionId === this.promotionFilter()) && (this.instructorFilter() === 'all' || item.trainingLeadId === this.instructorFilter()) && this.matches(this.groupText(item))));
  readonly visibleIndividuals = computed(() => this.individuals().filter((item) => this.statusMatches(item.status) && (this.programFilter() === 'all' || item.programId === this.programFilter()) && (this.instructorFilter() === 'all' || item.instructorId === this.instructorFilter()) && this.matches(`${this.personName(item)} ${this.programName(item.programId)} ${this.missionName(item.missionId)}`)));
  statusText = trainingAssignmentStatusLabel;
  readonly metrics = computed(() => { const all = [...this.groups(), ...this.individuals()]; const today = new Date().toISOString().slice(0, 10); const week = new Date(); week.setDate(week.getDate() + 7); return { today: all.filter((item) => ('scheduledDate' in item ? item.scheduledDate : item.date) === today).length, week: all.filter((item) => { const date = new Date('scheduledDate' in item ? item.scheduledDate : item.date); return date >= new Date() && date <= week; }).length, pending: all.filter((item) => item.status === 'scheduled' || item.status === 'assigned' || item.status === 'in-progress').length, completed: all.filter((item) => item.status === 'completed').length, cancelled: all.filter((item) => item.status === 'cancelled').length }; });
  constructor() { this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value)); this.listGroups.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => { this.groups.set(items); items.forEach((item) => this.listPromotionMembers.execute(item.promotionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((members) => this.pendingParticipants.update((counts) => ({ ...counts, [item.id]: Math.max(0, members.length - item.participantIds.length) })))); }); this.listIndividuals.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.individuals.set(items)); this.listPromotions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.promotions.set(items)); this.listPrograms.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.programs.set(items)); this.listUsers.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.users.set(items)); this.listMissions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.missions.set(items)); }
  setTab(tab: 'group' | 'individual'): void { this.tab.set(tab); this.search.setValue(''); }
  setFilter(filter: 'status' | 'program' | 'promotion' | 'instructor', value: string): void { if (filter === 'status') this.statusFilter.set(value as 'all' | TrainingAssignmentStatus); if (filter === 'program') this.programFilter.set(value); if (filter === 'promotion') this.promotionFilter.set(value); if (filter === 'instructor') this.instructorFilter.set(value); }
  create(): void { void this.router.navigate([`/catalogo/programacion-entrenamiento/${this.tab() === 'group' ? 'grupal' : 'individual'}/nuevo`]); }
  formatDate(value: string): string { const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : value; }
  promotionName(id: string): string { return this.promotions().find((item) => item.id === id)?.name ?? 'Sin promoción'; }
  programName(id: string | null): string { return id ? this.programs().find((item) => item.id === id)?.name ?? 'Sin programa' : 'Misión individual'; }
  userName(id: string | null): string { return id ? this.users().find((item) => item.id === id)?.firstName + ' ' + (this.users().find((item) => item.id === id)?.lastName ?? '') : 'Persona externa'; }
  missionName(id: string): string { return this.missions().find((item) => item.id === id)?.name ?? id; }
  personName(item: IndividualMissionAssignmentEntity): string { return item.externalPerson ?? this.userName(item.studentId); }
  openDetail(kind: 'group' | 'individual', id: string): void { void this.router.navigate(['/catalogo/programacion-entrenamiento', kind === 'group' ? 'grupal' : 'individual', id, 'editar']); }
  updateParticipants(id: string): void { void this.router.navigate(['/catalogo/programacion-entrenamiento/grupal', id, 'editar'], { queryParams: { step: '2.1' } }); }
  pendingCount(id: string): number { return this.pendingParticipants()[id] ?? 0; }
  askCancel(kind: 'group' | 'individual', id: string): void { this.cancelTarget.set({ kind, id }); }
  closeCancel(): void { this.cancelTarget.set(null); }
  confirmCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;
    if (target.kind === 'group') {
      const source = this.groups().find((item) => item.id === target.id);
      if (!source) return;
      this.updateGroup.execute(target.id, { ...source, status: 'cancelled', cancellationReason: 'Cancelada desde la programación operativa.' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cancelled());
      return;
    }
    const source = this.individuals().find((item) => item.id === target.id);
    if (!source) return;
    this.updateIndividual.execute(target.id, { ...source, status: 'cancelled', cancellationReason: 'Cancelada desde la programación operativa.' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cancelled());
  }
  private cancelled(): void { this.toast.success('Programación cancelada', 'El estado ya está actualizado.'); this.cancelTarget.set(null); }
  statusClass(status: string): string { return status.replace('-', '_'); }
  private statusMatches(status: string): boolean { return this.statusFilter() === 'all' || status === this.statusFilter(); }
  private groupText(item: GroupMissionAssignmentEntity): string { return `${this.promotionName(item.promotionId)} ${this.programName(item.programId)} ${this.userName(item.trainingLeadId)}`; }
  private matches(value: string): boolean { return !this.query().trim() || value.toLowerCase().includes(this.query().trim().toLowerCase()); }
}
