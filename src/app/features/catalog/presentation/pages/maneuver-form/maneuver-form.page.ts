import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateManeuver, ListManeuvers, ListOperations, UpdateManeuver } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { ManeuverBankWriteInput, OperationEntity } from '@core/domain/entities';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, holdFor } from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-maneuver-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './maneuver-form.page.html',
  styleUrl: './maneuver-form.page.scss',
})
export class ManeuverFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listOperations = inject(ListOperations);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly createManeuver = inject(CreateManeuver);
  private readonly updateManeuver = inject(UpdateManeuver);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly operations = signal<OperationEntity[]>([]);
  private left = false;
  readonly listHref = '/catalogo/maniobras';

  readonly operationOptions = computed<ChoiceOption[]>(() =>
    this.operations().map((item) => ({ value: item.id, label: item.name })),
  );

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva maniobra';
    if (this.isView) return 'Detalle de maniobra';
    return 'Editar maniobra';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta la operación, el código, el nombre y la descripción. Esta pantalla no permite cambios.'
      : 'Asigna la maniobra a una operación y define código, nombre y descripción.',
  );

  readonly form = new FormGroup({
    operationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    const id = this.editingId;
    if (!id) {
      this.listOperations.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (operations) => {
          this.operations.set(operations);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
      return;
    }
    forkJoin({ operations: this.listOperations.execute(), maneuvers: this.listManeuvers.execute() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ operations, maneuvers }) => {
          this.operations.set(operations);
          const item = maneuvers.find((entry) => entry.id === id);
          if (!item) {
            this.loadState.set('error');
            return;
          }
          this.form.reset({
            operationId: item.operationId,
            code: item.code,
            name: item.name,
            description: item.description,
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
    const payload: ManeuverBankWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateManeuver.execute(id, payload));
        this.toast.success('Maniobra actualizada', 'Los cambios de la maniobra ya están guardados.');
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([firstValueFrom(this.createManeuver.execute(payload)), holdFor(CATALOG_CREATE_HOLD_MS)]);
        if (this.left) return;
        this.toast.success('Maniobra creada', 'La maniobra ya está asignada a su operación.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la maniobra.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
