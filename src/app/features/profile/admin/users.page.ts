import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, firstValueFrom } from 'rxjs';
import { CreateAdminUser, ListAdminUsers, ListSpecialties, ListUserRoles, UpdateAdminUser } from '@core/application';
import { statusLabel } from '@core/domain/services/admin-catalog';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus, SpecialtyEntity, UserEntity, UserRoleEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { Modal } from '@shared/components/modal/modal';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';

type UserTab = 'general' | 'roles' | 'specialties';

@Component({
  selector: 'app-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    Icon,
    Modal,
    UiCheckbox,
    UiDatePicker,
    UiInput,
    UiLoading,
    UiSegmentedControl,
    UiSelect,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listSpecialties = inject(ListSpecialties);
  private readonly createUser = inject(CreateAdminUser);
  private readonly updateUser = inject(UpdateAdminUser);

  readonly users = signal<UserEntity[]>([]);
  readonly roles = signal<UserRoleEntity[]>([]);
  readonly specialties = signal<SpecialtyEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly tab = signal<UserTab>('general');
  readonly saving = signal(false);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedRoleIds = signal<string[]>([]);
  readonly selectedSpecialtyIds = signal<string[]>([]);

  readonly statusLabel = statusLabel;

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly entityStatusOptions: ChoiceOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  readonly tabOptions: ChoiceOption[] = [
    { value: 'general', label: 'Datos generales' },
    { value: 'roles', label: 'Roles' },
    { value: 'specialties', label: 'Especialidades' },
  ];

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entryDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    indicative: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.users().filter((user) => {
      if (status !== 'all' && user.status !== status) return false;
      if (!needle) return true;
      const hay = [user.firstName, user.lastName, user.email, user.documentNumber, user.indicative ?? ''].join(' ');
      return hay.toLowerCase().includes(needle);
    });
  });

  readonly modalTitle = computed(() => (this.editingId() ? 'Editar usuario' : 'Nuevo usuario'));

  constructor() {
    this.reload();
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  requiredError(name: string, message: string): string | undefined {
    const control = this.form.get(name);
    if (!control || !control.touched || control.valid) return undefined;
    return message;
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.tab.set('general');
    this.error.set(null);
    this.selectedRoleIds.set([]);
    this.selectedSpecialtyIds.set([]);
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      documentNumber: '',
      entryDate: '',
      indicative: '',
      status: 'active',
    });
    this.modalOpen.set(true);
  }

  openEdit(user: UserEntity): void {
    this.editingId.set(user.id);
    this.tab.set('general');
    this.error.set(null);
    this.selectedRoleIds.set([...user.roleIds]);
    this.selectedSpecialtyIds.set([...user.specialtyIds]);
    this.form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      documentNumber: user.documentNumber,
      entryDate: user.entryDate,
      indicative: user.indicative ?? '',
      status: user.status,
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  setTab(value: string): void {
    this.tab.set(value as UserTab);
  }

  toggleRole(id: string, checked: boolean): void {
    this.selectedRoleIds.update((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  toggleSpecialty(id: string, checked: boolean): void {
    this.selectedSpecialtyIds.update((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  async save(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tab.set('general');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      roleIds: this.selectedRoleIds(),
      specialtyIds: this.selectedSpecialtyIds(),
    };
    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await firstValueFrom(this.updateUser.execute(id, payload));
        this.notice.set('Hemos actualizado a la persona.');
      } else {
        await firstValueFrom(this.createUser.execute(payload));
        this.notice.set('La persona ya puede ingresar al sistema.');
      }
      this.modalOpen.set(false);
      this.reload();
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar el usuario.');
      this.tab.set('general');
    } finally {
      this.saving.set(false);
    }
  }

  private reload(): void {
    this.loadState.set('loading');
    forkJoin({
      users: this.listUsers.execute(),
      roles: this.listRoles.execute(),
      specialties: this.listSpecialties.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, roles, specialties }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.specialties.set(specialties);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
