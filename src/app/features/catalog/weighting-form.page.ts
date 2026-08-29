import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateWeighting,
  ListSquadrons,
  ListStandards,
  ListUnits,
  ListWeightings,
  UpdateWeighting,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type {
  InstructionProgram,
  SquadronEntity,
  StandardWeightingWriteInput,
  UnitEntity,
} from '@core/domain/entities';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, holdFor, instructionProgramOptions } from './catalog-form';

@Component({
  selector: 'app-weighting-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiDatePicker, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './weighting-form.page.html',
  styleUrl: './weighting-form.page.scss',
})
export class WeightingFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listStandards = inject(ListStandards);
  private readonly listUnits = inject(ListUnits);
  private readonly listSquadrons = inject(ListSquadrons);
  private readonly listWeightings = inject(ListWeightings);
  private readonly createWeighting = inject(CreateWeighting);
  private readonly updateWeighting = inject(UpdateWeighting);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly standardOptions = signal<ChoiceOption[]>([]);
  readonly units = signal<UnitEntity[]>([]);
  readonly squadrons = signal<SquadronEntity[]>([]);
  readonly selectedUnitId = signal('');
  private left = false;
  readonly listHref = '/catalogo/ponderaciones';
  readonly instructionProgramOptions = instructionProgramOptions;

  readonly unitOptions = computed<ChoiceOption[]>(() =>
    this.units().map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })),
  );

  readonly squadronOptions = computed<ChoiceOption[]>(() => {
    const unitId = this.selectedUnitId();
    return this.squadrons()
      .filter((item) => !unitId || item.unitId === unitId)
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }));
  });

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva ponderación';
    if (this.isView) return 'Detalle de ponderación';
    return 'Editar ponderación';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el estándar, el alcance y la vigencia. Esta pantalla no permite cambios.'
      : 'Estándar, unidad, escuadrón, programa, valor ponderado y vigencia.',
  );

  readonly form = new FormGroup({
    standardId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    unitId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    squadronId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    program: new FormControl<InstructionProgram>('PPL', { nonNullable: true, validators: [Validators.required] }),
    weightedValue: new FormControl(10, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    validFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    validTo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    this.form.controls.unitId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((unitId) => {
      this.selectedUnitId.set(unitId);
      const squadronId = this.form.controls.squadronId.value;
      if (squadronId && !this.squadronOptions().some((option) => option.value === squadronId)) {
        this.form.controls.squadronId.setValue('', { emitEvent: false });
      }
    });
    const id = this.editingId;
    forkJoin({
      standards: this.listStandards.execute(),
      units: this.listUnits.execute(),
      squadrons: this.listSquadrons.execute(),
      weightings: this.listWeightings.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ standards, units, squadrons, weightings }) => {
          this.standardOptions.set(standards.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })));
          this.units.set(units);
          this.squadrons.set(squadrons);
          if (id) {
            const item = weightings.find((entry) => entry.id === id);
            if (!item) {
              this.loadState.set('error');
              return;
            }
            this.selectedUnitId.set(item.unitId);
            this.form.reset({
              standardId: item.standardId,
              unitId: item.unitId,
              squadronId: item.squadronId,
              program: item.program,
              weightedValue: item.weightedValue,
              validFrom: item.validFrom,
              validTo: item.validTo,
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
    if (control.hasError('min') || control.hasError('max')) return 'El valor ponderado debe estar entre 0 y 100.';
    return message;
  }

  onProgram(value: string): void {
    if (value === 'PPL' || value === 'CPL' || value === 'ATPL' || value === 'IR') {
      this.form.controls.program.setValue(value);
    }
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: StandardWeightingWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateWeighting.execute(id, payload));
        this.toast.success('Ponderación actualizada', 'Los cambios de la ponderación ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createWeighting.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Ponderación creada', 'La ponderación ya está vigente en el catálogo.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la ponderación.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
