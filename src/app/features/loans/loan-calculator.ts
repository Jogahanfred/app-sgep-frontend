import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalculateLoanInstallment } from '@core/application';
import {
  DEFAULT_PERSONAL_LOAN_RATE,
  LOAN_AMOUNT_MAX,
  LOAN_AMOUNT_MIN,
  LOAN_TERM_MAX,
  LOAN_TERM_MIN,
  type LoanInstallment,
} from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { FormInput } from '@shared/components/input/input';
import { EurPipe } from '@shared/pipes/eur.pipe';

@Component({
  selector: 'app-loan-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormInput, Button, Alert, EurPipe],
  templateUrl: './loan-calculator.html',
  styleUrl: './loan-calculator.scss',
})
export class LoanCalculator {
  private readonly calculate = inject(CalculateLoanInstallment);

  readonly amountMin = LOAN_AMOUNT_MIN;
  readonly amountMax = LOAN_AMOUNT_MAX;
  readonly termMin = LOAN_TERM_MIN;
  readonly termMax = LOAN_TERM_MAX;

  readonly form = new FormGroup({
    amount: new FormControl(20_000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(LOAN_AMOUNT_MIN), Validators.max(LOAN_AMOUNT_MAX)],
    }),
    termMonths: new FormControl(60, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(LOAN_TERM_MIN), Validators.max(LOAN_TERM_MAX)],
    }),
  });

  readonly result = signal<LoanInstallment | null>(null);
  readonly error = signal<string | null>(null);
  readonly submitted = signal(false);

  amountError(): string | undefined {
    const control = this.form.controls.amount;
    if (!this.submitted() && !control.touched) return undefined;
    if (control.hasError('required') || control.hasError('min') || control.hasError('max')) {
      return `Indica un importe entre ${LOAN_AMOUNT_MIN} y ${LOAN_AMOUNT_MAX} €.`;
    }
    return undefined;
  }

  termError(): string | undefined {
    const control = this.form.controls.termMonths;
    if (!this.submitted() && !control.touched) return undefined;
    if (control.hasError('required') || control.hasError('min') || control.hasError('max')) {
      return `El plazo debe estar entre ${LOAN_TERM_MIN} y ${LOAN_TERM_MAX} meses.`;
    }
    return undefined;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.result.set(null);
      return;
    }

    try {
      const installment = this.calculate.execute({
        amount: Number(this.form.controls.amount.value),
        termMonths: Number(this.form.controls.termMonths.value),
        annualInterestRate: DEFAULT_PERSONAL_LOAN_RATE,
      });
      this.result.set(installment);
    } catch (err) {
      this.result.set(null);
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido calcular la cuota.');
    }
  }
}
