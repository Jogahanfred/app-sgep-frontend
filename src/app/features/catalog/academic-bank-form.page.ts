import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreatePhaseBank,
  CreateSubphaseBank,
  ListPhaseBanks,
  ListSubphaseBanks,
  UpdatePhaseBank,
  UpdateSubphaseBank,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus, PhaseBankWriteInput } from '@core/domain/entities';
import { firstValueFrom } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, entityStatusOptions, holdFor } from './catalog-form';
import type { AcademicBankKind } from './academic-bank-list.page';

@Component({
  selector: 'app-academic-bank-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './academic-bank-form.page.html',
  styleUrl: './academic-bank-form.page.scss',
})
export class AcademicBankFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);
  private readonly createPhaseBank = inject(CreatePhaseBank);
  private readonly updatePhaseBank = inject(UpdatePhaseBank);
  private readonly createSubphaseBank = inject(CreateSubphaseBank);
  private readonly updateSubphaseBank = inject(UpdateSubphaseBank);
  private readonly toast = inject(ToastService);
  private left = false;

  readonly kind = (this.route.snapshot.data['bank'] as AcademicBankKind) ?? 'phase';
  readonly isPhase = this.kind === 'phase';
  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>(this.isCreate ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly listHref = this.isPhase ? '/catalogo/banco-fases' : '/catalogo/banco-subfases';
  readonly entityStatusOptions = entityStatusOptions;
  readonly noun = this.isPhase ? 'banco de fase' : 'banco de subfase';

  readonly title = computed(() => {
    if (this.isCreate) return this.isPhase ? 'Nuevo banco de fase' : 'Nuevo banco de subfase';
    if (this.isView) return this.isPhase ? 'Detalle de banco de fase' : 'Detalle de banco de subfase';
    return this.isPhase ? 'Editar banco de fase' : 'Editar banco de subfase';
  });

  readonly lead = computed(() =>
    this.isView
      ? `Consulta el ${this.noun}. Esta pantalla no permite cambios.`
      : `Código, nombre, descripción y estado del ${this.noun}. Este catálogo vive fuera del programa.`,
  );

  readonly form = new FormGroup({
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
    const stream = this.isPhase ? this.listPhaseBanks.execute() : this.listSubphaseBanks.execute();
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const item = items.find((entry) => entry.id === id);
        if (!item) {
          this.loadState.set('error');
          return;
        }
        this.form.reset({
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

  requiredError(name: 'code' | 'name', fallback: string): string | undefined {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) return undefined;
    return fallback;
  }

  setStatus(value: string): void {
    if (this.isView) return;
    this.form.controls.status.setValue(value === 'inactive' ? 'inactive' : 'active');
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: PhaseBankWriteInput = this.form.getRawValue();
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(
          this.isPhase
            ? this.updatePhaseBank.execute(id, payload)
            : this.updateSubphaseBank.execute(id, payload),
        );
        this.toast.success(
          this.isPhase ? 'Banco de fase actualizado' : 'Banco de subfase actualizado',
          'Los cambios del banco ya están guardados.',
        );
        await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([
          firstValueFrom(
            this.isPhase ? this.createPhaseBank.execute(payload) : this.createSubphaseBank.execute(payload),
          ),
          holdFor(CATALOG_CREATE_HOLD_MS),
        ]);
        if (this.left) return;
        this.toast.success(
          this.isPhase ? 'Banco de fase creado' : 'Banco de subfase creado',
          'El banco ya está en el catálogo de formación académica.',
        );
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : `No hemos podido guardar el ${this.noun}.`;
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
