export type ProductCategory = 'account' | 'card' | 'loan' | 'mortgage' | 'investment';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  image?: string;
  badge?: string;
  features?: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'account',
  'card',
  'loan',
  'mortgage',
  'investment',
] as const;
