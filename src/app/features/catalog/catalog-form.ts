import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { passwordStrengthError } from '@core/domain/services/admin-catalog';
import type { ChoiceOption } from '@shared/models/choice.model';

export type CatalogKind = 'roles' | 'specialties';

export const CATALOG_CREATE_HOLD_MS = 3000;

export function holdFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const entityStatusOptions: ChoiceOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

export function catalogPasswordValidator(requiredPassword: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const message = passwordStrengthError(String(control.value ?? ''), requiredPassword);
    return message ? { password: message } : null;
  };
}

export function touchedError(control: AbstractControl | null, fallback: string): string | undefined {
  if (!control || !control.touched || control.valid) return undefined;
  if (control.hasError('password')) return String(control.getError('password'));
  if (control.hasError('email')) return 'Necesitamos un correo válido.';
  return fallback;
}
