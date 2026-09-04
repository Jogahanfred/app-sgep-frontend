import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateMissionType, ListMissionTypes, UpdateMissionType } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { MissionTypeWriteInput } from '@core/domain/entities';
import { firstValueFrom } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, holdFor } from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-mission-type-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading],
  templateUrl: './mission-type-form.page.html',
  styleUrl: './mission-type-form.page.scss',
})
export class MissionTypeFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listMissionTypes = inject(ListMissionTypes);
  private readonly createMissionType = inject(CreateMissionType);
  private readonly updateMissionType = inject(UpdateMissionType);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>(this.isCreate ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  private left = false;
  readonly listHref = '/catalogo/tipos-de-mision';

  readonly title = computed(() => {
    if (this.isCreate) return 'Nuevo tipo de misión';
    if (this.isView) return 'Detalle de tipo de misión';
    return 'Editar tipo de misión';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el código, el nombre y la descripción. Esta pantalla no permite cambios.'
      : 'Código, nombre y descripción del tipo de misión.',
  );

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    const id = this.editingId;
    if (!id) return;
    this.listMissionTypes.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const item = items.find((entry) => entry.id === id);
        if (!item) {
          this.loadState.set('error');
          return;
        }
        this.form.reset({ code: item.code, name: item.name, description: item.description });
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
    const payload: MissionTypeWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateMissionType.execute(id, payload));
        this.toast.success('Tipo de misión actualizado', 'Los cambios del tipo de misión ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createMissionType.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Tipo de misión creado', 'El tipo de misión ya está en el catálogo.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar el tipo de misión.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
