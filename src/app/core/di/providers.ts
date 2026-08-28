import { Provider } from '@angular/core';
import {
  CalculateLoanInstallment,
  CalculateMortgageInstallment,
  ChangeUserPassword,
  GetAccounts,
  GetCurrentUser,
  GetCards,
  GetFaqs,
  GetFeaturedProducts,
  GetHelpTopics,
  GetHomeContent,
  GetInvestmentProducts,
  GetLoans,
  GetMortgages,
  GetProductsByNeed,
  GetPromotions,
  UpdateUserAddress,
  UpdateUserContact,
  UpdateUserPhoto,
  UpdateUserPreferences,
  UpdateUserProfile,
} from '../application';
import { MockAccountRepository } from '../adapters/mock/mock-account.repository';
import { MockCardRepository } from '../adapters/mock/mock-card.repository';
import { MockFaqRepository } from '../adapters/mock/mock-faq.repository';
import { MockInvestmentRepository } from '../adapters/mock/mock-investment.repository';
import { MockLoanRepository } from '../adapters/mock/mock-loan.repository';
import { MockProductRepository } from '../adapters/mock/mock-product.repository';
import { MockPromotionRepository } from '../adapters/mock/mock-promotion.repository';
import { MockUserProfileRepository } from '../adapters/mock/mock-user.repository';
import type {
  AccountRepository,
  CardRepository,
  FaqRepository,
  InvestmentRepository,
  LoanRepository,
  ProductRepository,
  PromotionRepository,
  UserProfileRepository,
} from '../ports';
import {
  ACCOUNT_REPOSITORY,
  CARD_REPOSITORY,
  FAQ_REPOSITORY,
  INVESTMENT_REPOSITORY,
  LOAN_REPOSITORY,
  PRODUCT_REPOSITORY,
  PROMOTION_REPOSITORY,
  USER_PROFILE_REPOSITORY,
} from './tokens';

export const CORE_PROVIDERS: Provider[] = [
  { provide: PRODUCT_REPOSITORY, useClass: MockProductRepository },
  { provide: PROMOTION_REPOSITORY, useClass: MockPromotionRepository },
  { provide: ACCOUNT_REPOSITORY, useClass: MockAccountRepository },
  { provide: CARD_REPOSITORY, useClass: MockCardRepository },
  { provide: LOAN_REPOSITORY, useClass: MockLoanRepository },
  { provide: INVESTMENT_REPOSITORY, useClass: MockInvestmentRepository },
  { provide: FAQ_REPOSITORY, useClass: MockFaqRepository },
  { provide: USER_PROFILE_REPOSITORY, useClass: MockUserProfileRepository },
  { provide: CalculateLoanInstallment, useFactory: () => new CalculateLoanInstallment() },
  { provide: CalculateMortgageInstallment, useFactory: () => new CalculateMortgageInstallment() },
  {
    provide: GetFeaturedProducts,
    useFactory: (repo: ProductRepository) => new GetFeaturedProducts(repo),
    deps: [PRODUCT_REPOSITORY],
  },
  {
    provide: GetPromotions,
    useFactory: (repo: PromotionRepository) => new GetPromotions(repo),
    deps: [PROMOTION_REPOSITORY],
  },
  {
    provide: GetAccounts,
    useFactory: (repo: AccountRepository) => new GetAccounts(repo),
    deps: [ACCOUNT_REPOSITORY],
  },
  {
    provide: GetCards,
    useFactory: (repo: CardRepository) => new GetCards(repo),
    deps: [CARD_REPOSITORY],
  },
  {
    provide: GetLoans,
    useFactory: (repo: LoanRepository) => new GetLoans(repo),
    deps: [LOAN_REPOSITORY],
  },
  {
    provide: GetMortgages,
    useFactory: (repo: LoanRepository) => new GetMortgages(repo),
    deps: [LOAN_REPOSITORY],
  },
  {
    provide: GetInvestmentProducts,
    useFactory: (repo: InvestmentRepository) => new GetInvestmentProducts(repo),
    deps: [INVESTMENT_REPOSITORY],
  },
  {
    provide: GetFaqs,
    useFactory: (repo: FaqRepository) => new GetFaqs(repo),
    deps: [FAQ_REPOSITORY],
  },
  {
    provide: GetHelpTopics,
    useFactory: (repo: FaqRepository) => new GetHelpTopics(repo),
    deps: [FAQ_REPOSITORY],
  },
  {
    provide: GetProductsByNeed,
    useFactory: (repo: ProductRepository) => new GetProductsByNeed(repo),
    deps: [PRODUCT_REPOSITORY],
  },
  {
    provide: GetCurrentUser,
    useFactory: (repo: UserProfileRepository) => new GetCurrentUser(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: UpdateUserProfile,
    useFactory: (repo: UserProfileRepository) => new UpdateUserProfile(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: UpdateUserContact,
    useFactory: (repo: UserProfileRepository) => new UpdateUserContact(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: UpdateUserAddress,
    useFactory: (repo: UserProfileRepository) => new UpdateUserAddress(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: UpdateUserPhoto,
    useFactory: (repo: UserProfileRepository) => new UpdateUserPhoto(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: UpdateUserPreferences,
    useFactory: (repo: UserProfileRepository) => new UpdateUserPreferences(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: ChangeUserPassword,
    useFactory: (repo: UserProfileRepository) => new ChangeUserPassword(repo),
    deps: [USER_PROFILE_REPOSITORY],
  },
  {
    provide: GetHomeContent,
    useFactory: (products: ProductRepository, promotions: PromotionRepository, faqs: FaqRepository) =>
      new GetHomeContent(products, promotions, faqs),
    deps: [PRODUCT_REPOSITORY, PROMOTION_REPOSITORY, FAQ_REPOSITORY],
  },
];
