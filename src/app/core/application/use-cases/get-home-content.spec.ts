import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { FaqItem, HelpTopic, NeedOption, Product, ProductCategory, Promotion } from '../../domain/entities';
import type { FaqRepository, ProductRepository, PromotionRepository } from '../../ports';
import { GetHomeContent } from './get-home-content';

const loan: Product = {
  id: 'prestamo',
  title: 'Préstamo Personal',
  description: 'Financia tus planes.',
  category: 'loan',
  ctaLabel: 'Simular',
  ctaHref: '/prestamos',
};

const mortgage: Product = {
  id: 'hipoteca',
  title: 'Hipoteca Hogar',
  description: 'Compra tu vivienda.',
  category: 'mortgage',
  ctaLabel: 'Descubrir',
  ctaHref: '/hipotecas',
};

class FakeProductRepository implements ProductRepository {
  getFeaturedProducts() {
    return of([loan]);
  }

  getProductsByCategory(category: ProductCategory) {
    if (category === 'loan') return of([loan]);
    if (category === 'mortgage') return of([mortgage]);
    if (category === 'investment') return of([]);
    return of([]);
  }

  getNeedOptions() {
    return of([{ id: 'finance', label: 'Financiar', description: '', icon: 'credit' } as NeedOption]);
  }
}

class FakePromotionRepository implements PromotionRepository {
  getPromotions() {
    return of([{ id: 'promo-1', title: 'Oferta', description: '', ctaLabel: 'Ver', ctaHref: '/', variant: 'featured' } as Promotion]);
  }
}

class FakeFaqRepository implements FaqRepository {
  getFaqs() {
    return of([{ id: 'faq-1', question: '¿Cómo abro una cuenta?', answer: 'Online.' } as FaqItem]);
  }

  getHelpTopics() {
    return of([{ id: 'help-1', title: 'Oficinas', description: '', ctaLabel: 'Ver', ctaHref: '/', icon: 'pin' } as HelpTopic]);
  }
}

describe('GetHomeContent', () => {
  it('agrega contenido y combina préstamos e hipotecas en financiación', async () => {
    const useCase = new GetHomeContent(
      new FakeProductRepository(),
      new FakePromotionRepository(),
      new FakeFaqRepository(),
    );

    const content = await firstValueFrom(useCase.execute());

    expect(content.featuredProducts).toHaveLength(1);
    expect(content.financingProducts.map((item) => item.id)).toEqual(['prestamo', 'hipoteca']);
    expect(content.faqs[0]?.id).toBe('faq-1');
    expect(content.needOptions[0]?.id).toBe('finance');
  });
});
