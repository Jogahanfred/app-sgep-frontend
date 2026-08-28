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
export const LOAN_AMOUNT_MAX = 75_000;
export const LOAN_TERM_MIN = 12;
export const LOAN_TERM_MAX = 96;
export const DEFAULT_PERSONAL_LOAN_RATE = 6.9;
