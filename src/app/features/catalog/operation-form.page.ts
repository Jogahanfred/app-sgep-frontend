import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateOperation, ListOperations, UpdateOperation } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { CatalogWriteInput, EntityStatus } from '@core/domain/entities';
import { firstValueFrom } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, entityStatusOptions, holdFor } from './catalog-form';

@Component({
  selector: 'app-operation-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './operation-form.page.html',
  styleUrl: './operation-form.page.scss',
})
export class OperationFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listOperations = inject(ListOperations);
  private readonly createOperation = inject(CreateOperation);
  private readonly updateOperation = inject(UpdateOperation);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>(this.isCreate ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  private left = false;
  readonly listHref = '/catalogo/operaciones';
  readonly entityStatusOptions = entityStatusOptions;

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva operación';
    if (this.isView) return 'Detalle de operación';
    return 'Editar operación';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el nombre, la descripción y el estado. Esta pantalla no permite cambios.'
      : 'Nombre, descripción y estado de la operación de instrucción.',
  );

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    const id = this.editingId;
    if (!id) return;
    this.listOperations.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
        await firstValueFrom(this.updateOperation.execute(id, payload));
        this.toast.success('Operación actualizada', 'Los cambios de la operación ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createOperation.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Operación creada', 'La operación ya está en el catálogo de instrucción.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la operación.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
