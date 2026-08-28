import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { annualNominalToTae, CalculateMortgageInstallment } from '@core/application';
import {
  DEFAULT_MORTGAGE_RATE,
  MORTGAGE_AMOUNT_MAX,
  MORTGAGE_AMOUNT_MIN,
  MORTGAGE_TERM_MAX,
  MORTGAGE_TERM_MIN,
  type LoanInstallment,
} from '@core/domain/entities';
import { UiAmountField } from '@shared/components/ui-amount-field/ui-amount-field';
import { Button } from '@shared/components/button/button';
import { UiRadioCardGroup } from '@shared/components/ui-radio-card-group/ui-radio-card-group';
import { UiFieldLabel } from '@shared/components/ui-field-label/ui-field-label';
import { UiResultCard, type UiResultRow } from '@shared/components/ui-result-card/ui-result-card';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import type { ChoiceOption } from '@shared/models/choice.model';
import { formatCompactEur, formatPercent } from '@shared/utils/format-eur';

@Component({
  selector: 'app-mortgage-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiRadioCardGroup, UiAmountField, UiSegmentedControl, UiFieldLabel, UiResultCard, Button],
  templateUrl: './mortgage-calculator.html',
  styleUrl: './mortgage-calculator.scss',
})
export class MortgageCalculator {
  private readonly calculate = inject(CalculateMortgageInstallment);

  readonly houseOptions: ChoiceOption[] = [
    { value: 'searching', label: 'Todavía estoy buscando.' },
    { value: 'visiting', label: 'Ya visito viviendas, pero no he decidido.' },
    { value: 'reserved', label: 'Sí, la tengo elegida y reservada.' },
  ];

  readonly kindOptions: ChoiceOption[] = [
    { value: 'new', label: 'Obra nueva' },
    { value: 'resale', label: 'Segunda mano' },
  ];

  readonly tenureOptions: ChoiceOption[] = [
    { value: 'lt2', label: 'Menos de 2 años' },
    { value: '2to5', label: 'Entre 2 y 5 años' },
    { value: 'gt5', label: 'Más de 5 años' },
  ];

  readonly amountMin = MORTGAGE_AMOUNT_MIN;
  readonly amountMax = MORTGAGE_AMOUNT_MAX;
  readonly termMin = MORTGAGE_TERM_MIN;
  readonly termMax = MORTGAGE_TERM_MAX;

  readonly form = new FormGroup({
    houseStatus: new FormControl('reserved', { nonNullable: true }),
    homeKind: new FormControl('resale', { nonNullable: true }),
    tenure: new FormControl('lt2', { nonNullable: true }),
    amount: new FormControl(250_000, {
      nonNullable: true,
      validators: [Validators.min(MORTGAGE_AMOUNT_MIN), Validators.max(MORTGAGE_AMOUNT_MAX)],
    }),
    termMonths: new FormControl(300, {
      nonNullable: true,
      validators: [Validators.min(MORTGAGE_TERM_MIN), Validators.max(MORTGAGE_TERM_MAX)],
    }),
  });

  readonly result = signal<LoanInstallment | null>(null);
  readonly quoteRows = signal<UiResultRow[]>([]);

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

  private refresh(): void {
    if (this.form.invalid) {
      this.result.set(null);
      this.quoteRows.set([]);
      return;
    }

    const installment = this.calculate.execute({
      amount: this.form.controls.amount.value,
      termMonths: this.form.controls.termMonths.value,
      annualInterestRate: DEFAULT_MORTGAGE_RATE,
    });
    this.result.set(installment);
    this.quoteRows.set([
      { label: 'TIN', value: formatPercent(installment.annualInterestRate) },
      { label: 'TAE', value: formatPercent(annualNominalToTae(installment.annualInterestRate)) },
      { label: 'Importe total a devolver', value: formatCompactEur(installment.totalCost), strong: true },
    ]);
  }
}
