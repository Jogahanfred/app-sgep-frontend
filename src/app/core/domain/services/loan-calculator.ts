import { InvalidLoanInputError } from '../errors/domain-error';
import {
  LOAN_AMOUNT_MAX,
  LOAN_AMOUNT_MIN,
  LOAN_TERM_MAX,
  LOAN_TERM_MIN,
  type LoanCalculationInput,
  type LoanInstallment,
} from '../entities/loan-installment';

const CENTS = 100;

function roundCurrency(value: number): number {
  return Math.round(value * CENTS) / CENTS;
}

function assertValidInput(input: LoanCalculationInput): void {
  if (!Number.isFinite(input.amount) || input.amount < LOAN_AMOUNT_MIN || input.amount > LOAN_AMOUNT_MAX) {
    throw new InvalidLoanInputError(
      `El importe debe estar entre ${LOAN_AMOUNT_MIN} y ${LOAN_AMOUNT_MAX} euros.`,
    );
  }

  if (
    !Number.isInteger(input.termMonths) ||
    input.termMonths < LOAN_TERM_MIN ||
    input.termMonths > LOAN_TERM_MAX
  ) {
    throw new InvalidLoanInputError(
      `El plazo debe ser un número entero de meses entre ${LOAN_TERM_MIN} y ${LOAN_TERM_MAX}.`,
    );
  }

  if (!Number.isFinite(input.annualInterestRate) || input.annualInterestRate < 0 || input.annualInterestRate > 30) {
    throw new InvalidLoanInputError('El tipo de interés anual debe estar entre 0% y 30%.');
  }
}

export function calculateFrenchAmortization(input: LoanCalculationInput): LoanInstallment {
  assertValidInput(input);

  const { amount, termMonths, annualInterestRate } = input;
  const monthlyRate = annualInterestRate / 12 / 100;

  const monthlyPayment =
    monthlyRate === 0
      ? amount / termMonths
      : (amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const roundedPayment = roundCurrency(monthlyPayment);
  const totalCost = roundCurrency(roundedPayment * termMonths);
  const totalInterest = roundCurrency(totalCost - amount);

  return {
    amount,
    termMonths,
    annualInterestRate,
    monthlyPayment: roundedPayment,
    totalCost,
    totalInterest,
  };
}
