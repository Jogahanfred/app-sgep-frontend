import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateFleet, ListFleets, UpdateFleet } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus, FleetType, FleetWriteInput } from '@core/domain/entities';
import { FLEET_TYPES } from '@core/domain/entities';
import { firstValueFrom } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, entityStatusOptions, fleetTypeOptions, holdFor } from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-fleet-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './fleet-form.page.html',
  styleUrl: './fleet-form.page.scss',
})
export class FleetFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listFleets = inject(ListFleets);
  private readonly createFleet = inject(CreateFleet);
  private readonly updateFleet = inject(UpdateFleet);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>(this.isCreate ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  private left = false;
  readonly listHref = '/catalogo/flotas';
  readonly entityStatusOptions = entityStatusOptions;
  readonly fleetTypeOptions = fleetTypeOptions;

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva flota';
    if (this.isView) return 'Detalle de flota';
    return 'Editar flota';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el tipo, el código, el nombre, la descripción y el estado. Esta pantalla no permite cambios.'
      : 'Tipo de flota, código, nombre, descripción y estado.',
  );

  readonly form = new FormGroup({
    fleetType: new FormControl<FleetType>('fixed-wing', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
    this.listFleets.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const item = items.find((entry) => entry.id === id);
        if (!item) {
          this.loadState.set('error');
          return;
        }
        this.form.reset({
          fleetType: item.fleetType,
          code: item.code,
          name: item.name,
          description: item.description,
          status: item.status,
        });
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

  onFleetType(value: string): void {
    if ((FLEET_TYPES as readonly string[]).includes(value)) {
      this.form.controls.fleetType.setValue(value as FleetType);
    }
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: FleetWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateFleet.execute(id, payload));
        this.toast.success('Flota actualizada', 'Los cambios de la flota ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createFleet.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Flota creada', 'La flota ya está en el material aéreo.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la flota.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
