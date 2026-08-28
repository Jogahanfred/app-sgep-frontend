import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateAdminUser, GetAdminUser, ListSpecialties, ListUserRoles, UpdateAdminUser } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus, SpecialtyEntity, UserRoleEntity } from '@core/domain/entities';
import { forkJoin, firstValueFrom, of } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { catalogPasswordValidator, entityStatusOptions, touchedError } from './catalog-form';

type UserTab = 'general' | 'roles' | 'specialties';

@Component({
  selector: 'app-user-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    UiCheckbox,
    UiDatePicker,
    UiFormCard,
    UiInput,
    UiLoading,
    UiSegmentedControl,
    UiSelect,
  ],
  templateUrl: './user-form.page.html',
  styleUrl: './user-form.page.scss',
})
export class UserFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getUser = inject(GetAdminUser);
  private readonly createUser = inject(CreateAdminUser);
  private readonly updateUser = inject(UpdateAdminUser);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listSpecialties = inject(ListSpecialties);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly roles = signal<UserRoleEntity[]>([]);
  readonly specialties = signal<SpecialtyEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly tab = signal<UserTab>('general');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedRoleIds = signal<string[]>([]);
  readonly selectedSpecialtyIds = signal<string[]>([]);

  readonly title = computed(() => {
    if (this.isCreate) return 'Nuevo usuario';
    return this.isView ? 'Detalle de usuario' : 'Editar usuario';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta los datos generales, roles y especialidades. Esta pantalla no permite cambios.'
      : 'Completa los datos generales y, si aplica, los roles y especialidades.',
  );

  readonly entityStatusOptions: ChoiceOption[] = entityStatusOptions;

  readonly tabOptions: ChoiceOption[] = [
    { value: 'general', label: 'Datos generales' },
    { value: 'roles', label: 'Roles' },
    { value: 'specialties', label: 'Especialidades' },
  ];

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: this.isCreate
        ? [Validators.required, catalogPasswordValidator(true)]
        : [catalogPasswordValidator(false)],
    }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entryDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    indicative: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  constructor() {
    const id = this.editingId;
    forkJoin({
      user: id ? this.getUser.execute(id) : of(null),
      roles: this.listRoles.execute(),
      specialties: this.listSpecialties.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ user, roles, specialties }) => {
          this.roles.set(roles);
          this.specialties.set(specialties);
          if (user) {
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
            if (this.isView) this.form.disable({ emitEvent: false });
          }
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  requiredError(name: string, message: string): string | undefined {
    return touchedError(this.form.get(name), message);
  }

  setTab(value: string): void {
    this.tab.set(value as UserTab);
  }

  toggleRole(id: string, checked: boolean): void {
    if (this.isView) return;
    this.selectedRoleIds.update((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  toggleSpecialty(id: string, checked: boolean): void {
    if (this.isView) return;
    this.selectedSpecialtyIds.update((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tab.set('general');
      return;
    }
    const payload = {
      ...this.form.getRawValue(),
      roleIds: this.selectedRoleIds(),
      specialtyIds: this.selectedSpecialtyIds(),
    };
    this.saving.set(true);
    try {
      if (this.editingId) {
        await firstValueFrom(this.updateUser.execute(this.editingId, payload));
        await this.router.navigate(['/catalogo/usuarios'], { state: { notice: 'Hemos actualizado a la persona.' } });
      } else {
        await firstValueFrom(this.createUser.execute(payload));
        await this.router.navigate(['/catalogo/usuarios'], {
          state: { notice: 'La persona ya puede ingresar al sistema.' },
        });
      }
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar el usuario.');
      this.tab.set('general');
    } finally {
      this.saving.set(false);
    }
  }
}
