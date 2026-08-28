export type PromotionVariant = 'horizontal' | 'vertical' | 'featured' | 'compact';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  variant: PromotionVariant;
  eyebrow?: string;
  footnote?: string;
}
