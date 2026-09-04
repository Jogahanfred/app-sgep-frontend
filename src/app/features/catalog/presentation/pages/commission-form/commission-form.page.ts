import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateTemporaryCommission,
  ListAdminUsers,
  ListTemporaryCommissions,
  ListUnits,
  UpdateTemporaryCommission,
} from '@core/application';
import { COMMISSION_WORKFLOW, type CommissionWorkflowStatus, type TemporaryCommissionWriteInput } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { commissionEventTitle, commissionStatusLabel, nextCommissionStatus } from '@core/domain/services/admin-catalog';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { UiSteps, type StepItem } from '@shared/components/ui-steps/ui-steps';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS, holdFor } from '../../shared/forms/catalog-form';

@Component({
  selector: 'app-commission-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiDatePicker, UiFormCard, UiLoading, UiSelect, UiSteps, UiTextarea],
  templateUrl: './commission-form.page.html',
  styleUrl: './commission-form.page.scss',
})
export class CommissionFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listUnits = inject(ListUnits);
  private readonly listCommissions = inject(ListTemporaryCommissions);
  private readonly createCommission = inject(CreateTemporaryCommission);
  private readonly updateCommission = inject(UpdateTemporaryCommission);
  private readonly toast = inject(ToastService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly advancing = signal(false);
  readonly error = signal<string | null>(null);
  readonly workflow = signal<CommissionWorkflowStatus>('registered');
  private left = false;
  readonly listHref = '/catalogo/comisiones-temporales';

  readonly steps: StepItem[] = [
    { label: 'Registrado' },
    { label: 'Aprobado' },
    { label: 'Activo' },
    { label: 'Finalizado' },
  ];

  readonly userOptions = signal<ChoiceOption[]>([]);
  readonly unitOptions = signal<ChoiceOption[]>([]);

  readonly currentStep = computed(() => COMMISSION_WORKFLOW.indexOf(this.workflow()) + 1);
  readonly nextStatus = computed(() => nextCommissionStatus(this.workflow()));
  readonly nextLabel = computed(() => {
    const next = this.nextStatus();
    return next ? commissionStatusLabel(next) : null;
  });

  readonly title = computed(() => {
    if (this.isCreate) return 'Nueva comisión temporal';
    if (this.isView) return 'Detalle de comisión';
    return 'Editar comisión temporal';
  });
  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el movimiento del personal y el estado de la comisión. Esta pantalla no permite cambios de ficha.'
      : 'Registra a qué unidad se desplaza una persona, cuándo y por qué.',
  );

  readonly form = new FormGroup({
    userId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    originUnitId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinationUnitId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    const id = this.editingId;
    forkJoin({
      users: this.listUsers.execute(),
      units: this.listUnits.execute(),
      commissions: this.listCommissions.execute(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ users, units, commissions }) => {
        this.userOptions.set(
          users.map((user) => ({ value: user.id, label: `${user.firstName} ${user.lastName}` })),
        );
        this.unitOptions.set(units.map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })));
        if (id) {
          const item = commissions.find((entry) => entry.id === id);
          if (!item) {
            this.loadState.set('error');
            return;
          }
          this.workflow.set(item.status);
          this.form.reset({
            userId: item.userId,
            originUnitId: item.originUnitId,
            destinationUnitId: item.destinationUnitId,
            startDate: item.startDate,
            endDate: item.endDate,
            reason: item.reason,
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

  async save(): Promise<void> {
    if (this.isView) return;
    await this.persist(this.workflow(), false);
  }

  async advance(): Promise<void> {
    const next = this.nextStatus();
    if (!next) return;
    this.advancing.set(true);
    try {
      await this.persist(next, true);
    } finally {
      this.advancing.set(false);
    }
  }

  private payload(status: CommissionWorkflowStatus): TemporaryCommissionWriteInput {
    return { ...this.form.getRawValue(), status };
  }

  private async persist(status: CommissionWorkflowStatus, fromAdvance: boolean): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.payload(status);
    this.saving.set(true);
    try {
      const id = this.editingId;
      if (id) {
        await firstValueFrom(this.updateCommission.execute(id, payload));
        this.workflow.set(status);
        this.toast.success(
          fromAdvance ? commissionEventTitle(status) : 'Comisión actualizada',
          fromAdvance ? 'El timeline ya refleja el nuevo estado.' : 'Los cambios de la comisión ya están guardados.',
        );
        if (!fromAdvance) await this.router.navigate([this.listHref]);
      } else {
        this.creating.set(true);
        await Promise.all([
          firstValueFrom(this.createCommission.execute({ ...payload, status: 'registered' })),
          holdFor(CATALOG_CREATE_HOLD_MS),
        ]);
        if (this.left) return;
        this.toast.success('Comisión registrada', 'Queda en Registrado hasta que Administración la apruebe.');
        await this.router.navigate([this.listHref]);
      }
    } catch (err: unknown) {
      this.creating.set(false);
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la comisión.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally {
      this.saving.set(false);
    }
  }
}
