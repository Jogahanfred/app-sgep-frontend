export interface LoanCalculationInput {
  amount: number;
  termMonths: number;
  annualInterestRate: number;
}

export interface LoanInstallment {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  amount: number;
  termMonths: number;
  annualInterestRate: number;
}

export const LOAN_AMOUNT_MIN = 1_000;
export const LOAN_AMOUNT_MAX = 80_000;
export const LOAN_TERM_MIN = 12;
export const LOAN_TERM_MAX = 96;
export const DEFAULT_PERSONAL_LOAN_RATE = 6.9;

export const MORTGAGE_AMOUNT_MIN = 50_000;
export const MORTGAGE_AMOUNT_MAX = 6_500_000;
export const MORTGAGE_TERM_MIN = 60;
export const MORTGAGE_TERM_MAX = 360;
export const DEFAULT_MORTGAGE_RATE = 2.75;
