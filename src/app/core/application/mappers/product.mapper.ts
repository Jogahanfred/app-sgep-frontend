import type { Account, BankCard, Investment, Loan, Mortgage, Product } from '../../domain/entities';

export function mapAccountToProduct(account: Account): Product {
  return {
    id: account.id,
    title: account.name,
    description: account.summary,
    category: 'account',
    badge: account.badge,
    features: account.benefits,
    ctaLabel: account.ctaLabel,
    ctaHref: account.ctaHref,
  };
}

export function mapCardToProduct(card: BankCard): Product {
  return {
    id: card.id,
    title: card.name,
    description: card.summary,
    category: 'card',
    badge: card.badge,
    features: card.benefits,
    ctaLabel: card.ctaLabel,
    ctaHref: card.ctaHref,
  };
}

export function mapLoanToProduct(loan: Loan): Product {
  return {
    id: loan.id,
    title: loan.name,
    description: loan.summary,
    category: 'loan',
    badge: loan.badge,
    features: loan.benefits,
    ctaLabel: loan.ctaLabel,
    ctaHref: loan.ctaHref,
  };
}

export function mapMortgageToProduct(mortgage: Mortgage): Product {
  return {
    id: mortgage.id,
    title: mortgage.name,
    description: mortgage.summary,
    category: 'mortgage',
    badge: mortgage.badge,
    features: mortgage.benefits,
    ctaLabel: mortgage.ctaLabel,
    ctaHref: mortgage.ctaHref,
  };
}

export function mapInvestmentToProduct(investment: Investment): Product {
  return {
    id: investment.id,
    title: investment.name,
    description: investment.summary,
    category: 'investment',
    badge: investment.badge,
    features: investment.benefits,
    ctaLabel: investment.ctaLabel,
    ctaHref: investment.ctaHref,
  };
}
