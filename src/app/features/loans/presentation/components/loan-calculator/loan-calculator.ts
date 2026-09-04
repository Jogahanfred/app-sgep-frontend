import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { annualNominalToTae, CalculateLoanInstallment } from '@core/application';
import {
  DEFAULT_PERSONAL_LOAN_RATE,
  LOAN_AMOUNT_MAX,
  LOAN_AMOUNT_MIN,
  LOAN_TERM_MAX,
  LOAN_TERM_MIN,
  type LoanInstallment,
} from '@core/domain/entities';
import { Button } from '@shared/components/button/button';
import { UiCalcPanel } from '@shared/components/ui-calc-panel/ui-calc-panel';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiResultCard, type UiResultRow } from '@shared/components/ui-result-card/ui-result-card';
import { UiRangeSlider } from '@shared/components/ui-range-slider/ui-range-slider';
import { UiToggle } from '@shared/components/ui-toggle/ui-toggle';
import { formatCompactEur, formatPercent } from '@shared/utils/format-eur';

@Component({
  selector: 'app-loan-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiInput, UiRangeSlider, UiToggle, UiResultCard, Button, UiCalcPanel],
  templateUrl: './loan-calculator.html',
  styleUrl: './loan-calculator.scss',
})
export class LoanCalculator {
  private readonly calculate = inject(CalculateLoanInstallment);

  readonly amountMin = LOAN_AMOUNT_MIN;
  readonly amountMax = LOAN_AMOUNT_MAX;
  readonly termMin = LOAN_TERM_MIN;
  readonly termMax = LOAN_TERM_MAX;
  readonly amountMinLabel = `Mín. ${formatCompactEur(LOAN_AMOUNT_MIN)}`;
  readonly amountMaxLabel = `Máx. ${formatCompactEur(LOAN_AMOUNT_MAX)}`;

  readonly form = new FormGroup({
    amount: new FormControl(15_000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(LOAN_AMOUNT_MIN), Validators.max(LOAN_AMOUNT_MAX)],
    }),
    termMonths: new FormControl(60, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(LOAN_TERM_MIN), Validators.max(LOAN_TERM_MAX)],
    }),
  });

  readonly result = signal<LoanInstallment | null>(null);
  readonly quoteRows = signal<UiResultRow[]>([]);
  readonly sustainable = signal(false);
  readonly submitted = signal(false);

  constructor() {
    this.refresh();
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.refresh());
  }

  setAmount(value: number): void {
    this.form.controls.amount.setValue(value);
  }

  setTerm(value: number): void {
    this.form.controls.termMonths.setValue(Math.round(value));
  }

  termYearsHint(): string {
    const years = this.form.controls.termMonths.value / 12;
    const formatted = Number.isInteger(years)
      ? String(years)
      : years.toLocaleString('es-ES', { maximumFractionDigits: 1 });
    return `${formatted} ${years === 1 ? 'año' : 'años'}`;
  }

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
    this.form.markAllAsTouched();
    this.refresh();
  }

  private refresh(): void {
    if (this.form.invalid) {
      this.result.set(null);
      this.quoteRows.set([]);
      return;
    }

    try {
      const installment = this.calculate.execute({
        amount: Number(this.form.controls.amount.value),
        termMonths: Number(this.form.controls.termMonths.value),
        annualInterestRate: DEFAULT_PERSONAL_LOAN_RATE,
      });
      this.result.set(installment);
      const tin = formatPercent(installment.annualInterestRate);
      const tae = formatPercent(annualNominalToTae(installment.annualInterestRate));
      this.quoteRows.set([
        { label: `TIN fijo desde ${tin} (TAE ${tae})¹`, value: '' },
        { label: 'Comisión apertura', value: '0,00%' },
        { label: 'Importe total a devolver', value: formatCompactEur(installment.totalCost), strong: true },
      ]);
    } catch {
      this.result.set(null);
      this.quoteRows.set([]);
    }
  }
}
