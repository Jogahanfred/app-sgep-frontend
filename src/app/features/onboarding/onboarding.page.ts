import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Alert } from '@shared/components/alert/alert';
import { Breadcrumb } from '@shared/components/breadcrumb/breadcrumb';
import { Button } from '@shared/components/button/button';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { Container } from '@shared/components/container/container';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiHelp } from '@shared/components/ui-help/ui-help';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiSteps } from '@shared/components/ui-steps/ui-steps';
import type { ChoiceOption } from '@shared/models/choice.model';

function phonesMatch(group: AbstractControl): ValidationErrors | null {
  const phone = group.get('phone')?.value;
  const repeat = group.get('phoneRepeat')?.value;
  if (!phone || !repeat) return null;
  return phone === repeat ? null : { phonesMismatch: true };
}

@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Container,
    Breadcrumb,
    UiInput,
    UiSelect,
    UiCheckbox,
    Button,
    Alert,
    UiFormCard,
    UiHelp,
    UiSteps,
  ],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  readonly sent = signal(false);
  readonly formValid = signal(false);
  readonly currentStep = 1;

  readonly steps = [
    { label: 'Identificación' },
    { label: 'Cuenta' },
    { label: 'Verificación' },
    { label: 'Confirmación' },
  ];

  readonly documents: ChoiceOption[] = [
    { value: 'dni', label: 'DNI' },
    { value: 'nie', label: 'NIE' },
    { value: 'pasaporte', label: 'PASAPORTE' },
    { value: 'pasaporte-ext', label: 'PASAPORTE EXTRANJERO' },
  ];

  readonly prefixes: ChoiceOption[] = [
    { value: '+34', label: '+34' },
    { value: '+351', label: '+351' },
    { value: '+33', label: '+33' },
  ];

  readonly form = new FormGroup(
    {
      documentType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
      prefix: new FormControl('+34', { nonNullable: true, validators: [Validators.required] }),
      phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[0-9]{9}$/)],
      }),
      phoneRepeat: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[0-9]{9}$/)],
      }),
      noCard: new FormControl(false, { nonNullable: true }),
    },
    { validators: phonesMatch },
  );

  constructor() {
    this.form.statusChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.formValid.set(this.form.valid);
    });
  }

  fieldError(name: 'documentNumber' | 'phone' | 'phoneRepeat'): string | undefined {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      if (name === 'phoneRepeat' && this.form.touched && this.form.hasError('phonesMismatch')) {
        return 'Los teléfonos no coinciden';
      }
      return undefined;
    }
    if (name === 'documentNumber') return 'Indica el número del documento.';
    if (name === 'phone') return 'Introduce un teléfono de 9 dígitos.';
    return 'Introduce un teléfono de 9 dígitos.';
  }

  phoneRepeatError(): string | undefined {
    if (this.form.controls.phoneRepeat.touched && this.form.hasError('phonesMismatch')) {
      return 'Los teléfonos no coinciden';
    }
    return this.fieldError('phoneRepeat');
  }

  canContinue(): boolean {
    return this.formValid();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.sent.set(true);
    this.form.reset({ prefix: '+34', documentType: '', noCard: false });
  }
}
