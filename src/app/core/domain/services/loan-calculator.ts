import { InvalidLoanInputError } from '../errors/domain-error';
import {
  LOAN_AMOUNT_MAX,
  LOAN_AMOUNT_MIN,
  LOAN_TERM_MAX,
  LOAN_TERM_MIN,
  MORTGAGE_AMOUNT_MAX,
  MORTGAGE_AMOUNT_MIN,
  MORTGAGE_TERM_MAX,
  MORTGAGE_TERM_MIN,
  type LoanCalculationInput,
  type LoanInstallment,
} from '../entities/loan-installment';

const CENTS = 100;

function roundCurrency(value: number): number {
  return Math.round(value * CENTS) / CENTS;
}

function assertBaseInput(input: LoanCalculationInput): void {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new InvalidLoanInputError('El importe debe ser un número positivo.');
  }

  if (!Number.isInteger(input.termMonths) || input.termMonths < 1) {
    throw new InvalidLoanInputError('El plazo debe ser un número entero de meses.');
  }

  if (!Number.isFinite(input.annualInterestRate) || input.annualInterestRate < 0 || input.annualInterestRate > 30) {
    throw new InvalidLoanInputError('El tipo de interés anual debe estar entre 0% y 30%.');
  }
}

function assertRange(
  value: number,
  min: number,
  max: number,
  message: string,
): void {
  if (value < min || value > max) {
    throw new InvalidLoanInputError(message);
  }
}

export function annualNominalToTae(annualPercent: number): number {
  const monthly = annualPercent / 100 / 12;
  return roundCurrency(((1 + monthly) ** 12 - 1) * 100);
}

export function calculateFrenchSchedule(input: LoanCalculationInput): LoanInstallment {
  assertBaseInput(input);

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

export function calculateFrenchAmortization(input: LoanCalculationInput): LoanInstallment {
  assertRange(
    input.amount,
    LOAN_AMOUNT_MIN,
    LOAN_AMOUNT_MAX,
    `El importe debe estar entre ${LOAN_AMOUNT_MIN} y ${LOAN_AMOUNT_MAX} euros.`,
  );
  if (!Number.isInteger(input.termMonths) || input.termMonths < LOAN_TERM_MIN || input.termMonths > LOAN_TERM_MAX) {
    throw new InvalidLoanInputError(
      `El plazo debe ser un número entero de meses entre ${LOAN_TERM_MIN} y ${LOAN_TERM_MAX}.`,
    );
  }
  return calculateFrenchSchedule(input);
}

export function calculateMortgageAmortization(input: LoanCalculationInput): LoanInstallment {
  assertRange(
    input.amount,
    MORTGAGE_AMOUNT_MIN,
    MORTGAGE_AMOUNT_MAX,
    `El importe debe estar entre ${MORTGAGE_AMOUNT_MIN} y ${MORTGAGE_AMOUNT_MAX} euros.`,
  );
  if (
    !Number.isInteger(input.termMonths) ||
    input.termMonths < MORTGAGE_TERM_MIN ||
    input.termMonths > MORTGAGE_TERM_MAX
  ) {
    throw new InvalidLoanInputError('El plazo de la hipoteca debe estar entre 5 y 30 años.');
  }
  return calculateFrenchSchedule(input);
}
