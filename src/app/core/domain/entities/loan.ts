export type LoanKind = 'personal' | 'auto' | 'renovation';

export interface Loan {
  id: string;
  name: string;
  summary: string;
  kind: LoanKind;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  annualInterestRate: number;
  benefits: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}
