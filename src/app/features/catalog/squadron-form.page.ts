import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateSquadron, ListSquadrons, ListUnits, UpdateSquadron } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus, SquadronWriteInput, UnitEntity } from '@core/domain/entities';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, entityStatusOptions, holdFor } from './catalog-form';

@Component({
  selector: 'app-squadron-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './squadron-form.page.html',
  styleUrl: './squadron-form.page.scss',
})
export class SquadronFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listUnits = inject(ListUnits);
  private readonly listSquadrons = inject(ListSquadrons);
  private readonly createSquadron = inject(CreateSquadron);
  private readonly updateSquadron = inject(UpdateSquadron);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly units = signal<UnitEntity[]>([]);
  private left = false;
  readonly listHref = '/catalogo/escuadrones';
  readonly entityStatusOptions = entityStatusOptions;

  readonly unitOptions = computed<ChoiceOption[]>(() =>
    this.units().map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })),
  );

  readonly title = computed(() => {
    if (this.isCreate) return 'Nuevo escuadrón';
    if (this.isView) return 'Detalle de escuadrón';
    return 'Editar escuadrón';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta la unidad, el código, el nombre y el estado. Esta pantalla no permite cambios.'
      : 'Asigna el escuadrón a una unidad y define código, nombre, descripción y estado.',
  );

  readonly form = new FormGroup({
    unitId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
    if (!id) {
      this.listUnits.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (units) => {
          this.units.set(units);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
      return;
    }
    forkJoin({ units: this.listUnits.execute(), squadrons: this.listSquadrons.execute() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ units, squadrons }) => {
          this.units.set(units);
          const item = squadrons.find((entry) => entry.id === id);
          if (!item) {
            this.loadState.set('error');
            return;
          }
          this.form.reset({
            unitId: item.unitId,
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

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: SquadronWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateSquadron.execute(id, payload));
        this.toast.success('Escuadrón actualizado', 'Los cambios del escuadrón ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createSquadron.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Escuadrón creado', 'El escuadrón ya está asignado a su unidad.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar el escuadrón.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
