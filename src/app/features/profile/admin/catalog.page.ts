import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, type Observable } from 'rxjs';
import { CreateSpecialty, CreateUserRole, ListSpecialties, ListUserRoles, UpdateSpecialty, UpdateUserRole } from '@core/application';
import { matchesAdminSearch, statusLabel } from '@core/domain/services/admin-catalog';
import { DomainError } from '@core/domain/errors/domain-error';
import type { CatalogWriteInput, EntityStatus, SpecialtyEntity, UserRoleEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { Modal } from '@shared/components/modal/modal';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';

export type CatalogKind = 'roles' | 'specialties';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, Icon, Modal, UiInput, UiLoading, UiSelect],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
})
export class CatalogPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly listRoles = inject(ListUserRoles);
  private readonly createRole = inject(CreateUserRole);
  private readonly updateRole = inject(UpdateUserRole);
  private readonly listSpecialties = inject(ListSpecialties);
  private readonly createSpecialty = inject(CreateSpecialty);
  private readonly updateSpecialty = inject(UpdateSpecialty);

  readonly kind = (this.route.snapshot.data['catalog'] as CatalogKind) ?? 'roles';
  readonly items = signal<(UserRoleEntity | SpecialtyEntity)[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | EntityStatus>('all');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly statusLabel = statusLabel;
  readonly isRoles = this.kind === 'roles';
  readonly title = this.isRoles ? 'Roles de usuario' : 'Especialidades';
  readonly lead = this.isRoles
    ? 'Define quién entra como administrador, director académico, instructor o alumno.'
    : 'Catálogo de especialidades que puedes asignar a cada persona.';
  readonly createLabel = this.isRoles ? 'Nuevo rol' : 'Nueva especialidad';
  readonly nameLabel = this.isRoles ? 'Nombre del rol' : 'Nombre';
  readonly namePlaceholder = this.isRoles ? 'Jefe de Instrucción' : 'Pilotaje';

  readonly statusOptions: ChoiceOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  readonly entityStatusOptions: ChoiceOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  readonly filtered = computed(() => {
    const needle = this.query();
    const status = this.statusFilter();
    return this.items().filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      return matchesAdminSearch([item.name, item.description], needle);
    });
  });

  readonly modalTitle = computed(() => {
    if (this.editingId()) return this.isRoles ? 'Editar rol' : 'Editar especialidad';
    return this.isRoles ? 'Nuevo rol' : 'Nueva especialidad';
  });

  constructor() {
    this.reload();
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
    this.error.set(null);
    this.form.reset({ name: '', description: '', status: 'active' });
    this.modalOpen.set(true);
  }

  openEdit(item: UserRoleEntity | SpecialtyEntity): void {
    this.editingId.set(item.id);
    this.error.set(null);
    this.form.reset({ name: item.name, description: item.description, status: item.status });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: CatalogWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await firstValueFrom(this.update$(id, payload));
        this.notice.set(this.isRoles ? 'Rol actualizado.' : 'Especialidad actualizada.');
      } else {
        await firstValueFrom(this.create$(payload));
        this.notice.set(this.isRoles ? 'Rol creado.' : 'Especialidad creada.');
      }
      this.modalOpen.set(false);
      this.reload();
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar los cambios.');
    } finally {
      this.saving.set(false);
    }
  }

  private create$(input: CatalogWriteInput): Observable<UserRoleEntity | SpecialtyEntity> {
    return this.isRoles ? this.createRole.execute(input) : this.createSpecialty.execute(input);
  }

  private update$(id: string, input: CatalogWriteInput): Observable<UserRoleEntity | SpecialtyEntity> {
    return this.isRoles ? this.updateRole.execute(id, input) : this.updateSpecialty.execute(id, input);
  }

  private reload(): void {
    this.loadState.set('loading');
    const stream = this.isRoles ? this.listRoles.execute() : this.listSpecialties.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }
}
