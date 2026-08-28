export type MortgageRateType = 'fixed' | 'variable' | 'mixed';

export interface Mortgage {
  id: string;
  name: string;
  summary: string;
  rateType: MortgageRateType;
  annualInterestRate: number;
  maxLoanToValue: number;
  maxTermYears: number;
  benefits: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}
