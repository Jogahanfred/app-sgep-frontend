import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateAircraft, ListAircraft, ListFleets, ListUnits, UpdateAircraft } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { AircraftWriteInput, EntityStatus, FleetEntity, UnitEntity } from '@core/domain/entities';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import {
  CATALOG_CREATE_HOLD_MS,
  entityStatusOptions,
  holdFor,
  operationalFormOptions,
} from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-aircraft-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './aircraft-form.page.html',
  styleUrl: './aircraft-form.page.scss',
})
export class AircraftFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listAircraft = inject(ListAircraft);
  private readonly listFleets = inject(ListFleets);
  private readonly listUnits = inject(ListUnits);
  private readonly createAircraft = inject(CreateAircraft);
  private readonly updateAircraft = inject(UpdateAircraft);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly units = signal<UnitEntity[]>([]);
  readonly fleets = signal<FleetEntity[]>([]);
  readonly imageUrl = signal('');
  private left = false;
  readonly listHref = '/catalogo/aeronaves';
  readonly entityStatusOptions = entityStatusOptions;
  readonly operationalFormOptions = operationalFormOptions;

  readonly unitOptions = computed<ChoiceOption[]>(() =>
    this.units().map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })),
  );

  readonly fleetOptions = computed<ChoiceOption[]>(() =>
    this.fleets().map((fleet) => ({ value: fleet.id, label: `${fleet.code} · ${fleet.name}` })),
  );

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva aeronave';
    if (this.isView) return 'Detalle de aeronave';
    return 'Editar aeronave';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta la foto, la matrícula, la flota, la unidad y si está operativa. Esta pantalla no permite cambios.'
      : 'Unidad, flota, matrícula, operativa, estado y foto de la aeronave.',
  );

  readonly form = new FormGroup({
    unitId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fleetId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    registration: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    operational: new FormControl(true, { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    const id = this.editingId;
    forkJoin({
      units: this.listUnits.execute(),
      fleets: this.listFleets.execute(),
      aircraft: this.listAircraft.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ units, fleets, aircraft }) => {
          this.units.set(units);
          this.fleets.set(fleets);
          if (id) {
            const item = aircraft.find((entry) => entry.id === id);
            if (!item) {
              this.loadState.set('error');
              return;
            }
            this.imageUrl.set(item.imageUrl);
            this.form.reset({
              unitId: item.unitId,
              fleetId: item.fleetId,
              registration: item.registration,
              operational: item.operational,
              status: item.status,
              imageUrl: item.imageUrl,
            });
            if (this.isView) this.form.disable({ emitEvent: false });
          }
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

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Elige una imagen JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 2_000_000) {
      this.error.set('La imagen no puede superar 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      this.imageUrl.set(value);
      this.form.controls.imageUrl.setValue(value);
      this.form.controls.imageUrl.markAsTouched();
      this.error.set(null);
    };
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: AircraftWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateAircraft.execute(id, payload));
        this.toast.success('Aeronave actualizada', 'Los cambios de la aeronave ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createAircraft.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Aeronave registrada', 'La aeronave ya está en el material aéreo.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la aeronave.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
