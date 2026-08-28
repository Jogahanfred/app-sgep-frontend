import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateAdminUser } from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type { EntityStatus } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { catalogPasswordValidator, entityStatusOptions, touchedError } from './catalog-form';

@Component({
  selector: 'app-user-quick-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, Modal, UiDatePicker, UiInput, UiSelect],
  templateUrl: './user-quick-create.html',
  styleUrl: './users-list.page.scss',
})
export class UserQuickCreate {
  private readonly destroyRef = inject(DestroyRef);
  private readonly createUser = inject(CreateAdminUser);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly created = output<void>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly entityStatusOptions = entityStatusOptions;

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, catalogPasswordValidator(true)],
    }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entryDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    indicative: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.error.set(null);
      this.form.reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        documentNumber: '',
        entryDate: '',
        indicative: '',
        status: 'active',
      });
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
    this.saving.set(true);
    this.createUser
      .execute({
        ...this.form.getRawValue(),
        roleIds: [],
        specialtyIds: [],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.created.emit();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(err instanceof DomainError ? err.message : 'No hemos podido crear a la persona.');
        },
      });
  }
}
