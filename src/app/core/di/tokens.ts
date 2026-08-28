import { InjectionToken } from '@angular/core';
import type {
  AccountRepository,
  AdminCatalogRepository,
  CardRepository,
  FaqRepository,
  InvestmentRepository,
  LoanRepository,
  ProductRepository,
  PromotionRepository,
  UserProfileRepository,
} from '../ports';

export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('PRODUCT_REPOSITORY');
export const PROMOTION_REPOSITORY = new InjectionToken<PromotionRepository>('PROMOTION_REPOSITORY');
export const ACCOUNT_REPOSITORY = new InjectionToken<AccountRepository>('ACCOUNT_REPOSITORY');
export const CARD_REPOSITORY = new InjectionToken<CardRepository>('CARD_REPOSITORY');
export const LOAN_REPOSITORY = new InjectionToken<LoanRepository>('LOAN_REPOSITORY');
export const INVESTMENT_REPOSITORY = new InjectionToken<InvestmentRepository>('INVESTMENT_REPOSITORY');
export const FAQ_REPOSITORY = new InjectionToken<FaqRepository>('FAQ_REPOSITORY');
export const USER_PROFILE_REPOSITORY = new InjectionToken<UserProfileRepository>('USER_PROFILE_REPOSITORY');
export const ADMIN_CATALOG_REPOSITORY = new InjectionToken<AdminCatalogRepository>('ADMIN_CATALOG_REPOSITORY');
