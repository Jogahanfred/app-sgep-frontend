export interface Account {
  id: string;
  name: string;
  summary: string;
  monthlyFee: number;
  minimumIncome?: number;
  benefits: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}
