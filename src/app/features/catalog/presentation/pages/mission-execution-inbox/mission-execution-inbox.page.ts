import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListIndividualAssignments, ListMissionExecutions, ListMissionTypes, ListPrograms, ListAdminUsers } from '@core/application';
import type { IndividualMissionAssignmentEntity, MissionExecutionEntity, MissionTypeEntity, ProgramEntity, UserEntity } from '@core/domain/entities';
import { Card } from '@shared/components/card/card';
import { Button } from '@shared/components/button/button';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({ selector: 'app-mission-execution-inbox', changeDetection: ChangeDetectionStrategy.OnPush, imports: [ReactiveFormsModule, Button, Card, UiInput, UiSelect], templateUrl: './mission-execution-inbox.page.html', styleUrl: './mission-execution-inbox.page.scss' })
export class MissionExecutionInboxPage {
  private readonly destroyRef = inject(DestroyRef); private readonly router = inject(Router); private readonly listAssignments = inject(ListIndividualAssignments); private readonly listExecutions = inject(ListMissionExecutions); private readonly listMissions = inject(ListMissionTypes); private readonly listPrograms = inject(ListPrograms); private readonly listUsers = inject(ListAdminUsers);
  readonly assignments = signal<IndividualMissionAssignmentEntity[]>([]); readonly executions = signal<MissionExecutionEntity[]>([]); readonly missions = signal<MissionTypeEntity[]>([]); readonly programs = signal<ProgramEntity[]>([]); readonly users = signal<UserEntity[]>([]); readonly search = new FormControl('', { nonNullable: true }); readonly query = signal(''); readonly status = signal('all');
  readonly statusOptions: ChoiceOption[] = [{ value: 'all', label: 'Todas' }, { value: 'scheduled', label: 'Programadas' }, { value: 'in-progress', label: 'En ejecución' }, { value: 'completed', label: 'Completadas' }];
  readonly visible = computed(() => this.assignments().filter((assignment) => { const execution = this.executionFor(assignment.id); const status = execution?.status ?? 'scheduled'; const text = `${this.person(assignment)} ${this.program(assignment.programId)} ${this.mission(assignment.missionId)}`.toLowerCase(); return (this.status() === 'all' || this.status() === status) && (!this.query().trim() || text.includes(this.query().trim().toLowerCase())); }));
  constructor() { this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.query.set(value)); this.listAssignments.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.assignments.set(items)); this.listExecutions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.executions.set(items)); this.listMissions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.missions.set(items)); this.listPrograms.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.programs.set(items)); this.listUsers.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.users.set(items)); }
  executionFor(id: string): MissionExecutionEntity | undefined { return this.executions().find((item) => item.individualAssignmentId === id); }
  person(item: IndividualMissionAssignmentEntity): string { return item.externalPerson ?? this.userName(item.studentId); }
  userName(id: string | null): string { const user = id ? this.users().find((item) => item.id === id) : undefined; return user ? `${user.firstName} ${user.lastName}` : 'Persona externa'; }
  program(id: string | null): string { return id ? this.programs().find((item) => item.id === id)?.name ?? 'Sin programa' : 'Misión individual'; }
  mission(id: string): string { return this.missions().find((item) => item.id === id)?.name ?? id; }
  date(value: string): string { const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : value; }
  label(status: string): string { return status === 'in-progress' ? 'En ejecución' : status === 'completed' ? 'Completada' : 'Programada'; }
  open(id: string): void { const execution = this.executions().find((item) => item.individualAssignmentId === id); if (execution) void this.router.navigate(['/catalogo/ejecucion-misiones', execution.id]); }
}
