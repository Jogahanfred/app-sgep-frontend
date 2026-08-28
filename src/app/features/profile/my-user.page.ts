import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GetAdminUser, UpdateAdminUser } from '@core/application';
import { statusLabel } from '@core/domain/services/admin-catalog';
import { DomainError } from '@core/domain/errors/domain-error';
import type { UserEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '../../layout/client-session.service';

@Component({
  selector: 'app-my-user-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiDatePicker, UiFormCard, UiInput, UiLoading],
  templateUrl: './my-user.page.html',
  styleUrl: './my-user.page.scss',
})
export class MyUserPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(ClientSession);
  private readonly getUser = inject(GetAdminUser);
  private readonly updateUser = inject(UpdateAdminUser);

  readonly user = signal<UserEntity | null>(null);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly statusLabel = statusLabel;

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entryDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    indicative: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    const id = this.session.userId();
    if (!id) {
      this.loadState.set('error');
      return;
    }
    this.getUser
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.apply(user);
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
    const current = this.user();
    this.error.set(null);
    this.notice.set(null);
    if (!current || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const raw = this.form.getRawValue();
      const updated = await firstValueFrom(
        this.updateUser.execute(current.id, {
          ...raw,
          status: current.status,
          roleIds: current.roleIds,
          specialtyIds: current.specialtyIds,
        }),
      );
      this.apply(updated);
      this.session.signIn(updated.firstName, updated.id);
      this.notice.set('Hemos actualizado tu usuario.');
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar tu usuario.');
    } finally {
      this.saving.set(false);
    }
  }

  private apply(user: UserEntity): void {
    this.user.set(user);
    this.form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      documentNumber: user.documentNumber,
      entryDate: user.entryDate,
      indicative: user.indicative ?? '',
    });
  }
}
