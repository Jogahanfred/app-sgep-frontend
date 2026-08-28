import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSpecialty, CreateUserRole } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { entityStatusOptions, touchedError, type CatalogKind } from './catalog-form';

@Component({
  selector: 'app-item-quick-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, Modal, UiInput, UiSelect],
  templateUrl: './item-quick-create.html',
  styleUrl: './items-list.page.scss',
})
export class ItemQuickCreate {
  private readonly destroyRef = inject(DestroyRef);
  private readonly createRole = inject(CreateUserRole);
  private readonly createSpecialty = inject(CreateSpecialty);

  readonly kind = input<CatalogKind>('roles');
  readonly open = input(false);
  readonly closed = output<void>();
  readonly created = output<void>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly entityStatusOptions = entityStatusOptions;
  readonly isRoles = computed(() => this.kind() === 'roles');
  readonly title = computed(() => (this.isRoles() ? 'Alta rápida de rol' : 'Alta rápida de especialidad'));
  readonly nameLabel = computed(() => (this.isRoles() ? 'Nombre del rol' : 'Nombre'));
  readonly namePlaceholder = computed(() => (this.isRoles() ? 'Jefe de Instrucción' : 'Pilotaje'));

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.error.set(null);
      this.form.reset({ name: '', description: '', status: 'active' });
    });
  }

  fieldError(name: string, fallback: string): string | undefined {
    return touchedError(this.form.get(name), fallback);
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  save(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    const stream = this.isRoles() ? this.createRole.execute(payload) : this.createSpecialty.execute(payload);
    this.saving.set(true);
    stream.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar el registro.');
      },
    });
  }
}
