import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alert } from '@shared/components/alert/alert';
import { Breadcrumb } from '@shared/components/breadcrumb/breadcrumb';
import { Button } from '@shared/components/button/button';
import { Container } from '@shared/components/container/container';
import { FormInput } from '@shared/components/input/input';
import { FormSelect } from '@shared/components/select/select';

@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Container, Breadcrumb, FormInput, FormSelect, Button, Alert],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  readonly sent = signal(false);

  readonly products = [
    { value: 'cuenta-clara', label: 'Cuenta Clara' },
    { value: 'tarjeta-norte', label: 'Tarjeta Norte' },
    { value: 'prestamo-impulso', label: 'Préstamo Impulso' },
    { value: 'hipoteca-hogar', label: 'Hipoteca Hogar' },
    { value: 'fondo-horizonte', label: 'Fondo Horizonte' },
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{9}$/)],
    }),
    product: new FormControl('cuenta-clara', { nonNullable: true, validators: [Validators.required] }),
  });

  fieldError(name: 'name' | 'email' | 'phone'): string | undefined {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) return undefined;
    if (name === 'name') return 'Escribe tu nombre.';
    if (name === 'email') return 'Necesitamos un correo válido.';
    return 'Introduce un teléfono de 9 dígitos.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
    this.form.reset({ product: 'cuenta-clara' });
  }
}
