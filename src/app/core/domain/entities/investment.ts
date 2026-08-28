export type InvestmentKind = 'fund' | 'savings' | 'pension' | 'planning';

export interface Investment {
  id: string;
  name: string;
  summary: string;
  kind: InvestmentKind;
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  recommendedHorizon: string;
  benefits: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}
