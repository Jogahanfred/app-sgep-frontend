export type CardKind = 'debit' | 'credit';

export interface BankCard {
  id: string;
  name: string;
  summary: string;
  kind: CardKind;
  annualFee: number;
  cashbackPercent?: number;
  benefits: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}
