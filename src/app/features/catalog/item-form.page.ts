import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateSpecialty, CreateUserRole, ListSpecialties, ListUserRoles, UpdateSpecialty, UpdateUserRole } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { CatalogWriteInput, EntityStatus, SpecialtyEntity, UserRoleEntity } from '@core/domain/entities';
import { firstValueFrom, type Observable } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { CatalogKind } from './items-list.page';

@Component({
  selector: 'app-item-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './item-form.page.html',
  styleUrl: './item-form.page.scss',
})
export class ItemFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listRoles = inject(ListUserRoles);
  private readonly createRole = inject(CreateUserRole);
  private readonly updateRole = inject(UpdateUserRole);
  private readonly listSpecialties = inject(ListSpecialties);
  private readonly createSpecialty = inject(CreateSpecialty);
  private readonly updateSpecialty = inject(UpdateSpecialty);
  private readonly toast = inject(ToastService);

  readonly kind = (this.route.snapshot.data['catalog'] as CatalogKind) ?? 'roles';
  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly isRoles = this.kind === 'roles';
  readonly loadState = signal<'loading' | 'ready' | 'error'>(this.isCreate ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly listHref = this.isRoles ? '/catalogo/roles' : '/catalogo/especialidades';
  readonly nameLabel = this.isRoles ? 'Nombre del rol' : 'Nombre';
  readonly namePlaceholder = this.isRoles ? 'Jefe de Instrucción' : 'Pilotaje';

  readonly title = computed(() => {
    if (this.isCreate) return this.isRoles ? 'Nuevo rol' : 'Nueva especialidad';
    if (this.isView) return this.isRoles ? 'Detalle de rol' : 'Detalle de especialidad';
    return this.isRoles ? 'Editar rol' : 'Editar especialidad';
  });
  readonly lead = computed(() => {
    if (this.isView) {
      return this.isRoles
        ? 'Consulta el nombre, la descripción y el estado del rol. Esta pantalla no permite cambios.'
        : 'Consulta el nombre, la descripción y el estado de la especialidad. Esta pantalla no permite cambios.';
    }
    return this.isRoles ? 'Nombre, descripción y estado del rol.' : 'Nombre, descripción y estado de la especialidad.';
  });

  readonly entityStatusOptions: ChoiceOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  constructor() {
    const id = this.editingId;
    if (!id) return;
    const stream = this.isRoles ? this.listRoles.execute() : this.listSpecialties.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const item = items.find((entry) => entry.id === id);
        if (!item) {
          this.loadState.set('error');
          return;
        }
        this.form.reset({ name: item.name, description: item.description, status: item.status });
        if (this.isView) this.form.disable({ emitEvent: false });
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  requiredError(name: string, message: string): string | undefined {
    const control = this.form.get(name);
    if (!control || !control.touched || control.valid) return undefined;
    return message;
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: CatalogWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.update$(id, payload));
        this.toast.success(this.isRoles ? 'Rol actualizado.' : 'Especialidad actualizada.');
        await this.router.navigate([this.listHref]);
      } else {
        await firstValueFrom(this.create$(payload));
        this.toast.success(this.isRoles ? 'Rol creado.' : 'Especialidad creada.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar los cambios.';
      this.error.set(message);
      this.toast.error(message);
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
}
