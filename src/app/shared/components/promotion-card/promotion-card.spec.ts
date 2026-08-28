import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Promotion } from '@core/domain/entities';
import { PromotionCard } from './promotion-card';

const promotion: Promotion = {
  id: 'promo',
  title: 'Hasta 280 € de bienvenida',
  description: 'Domicilia tus ingresos.',
  ctaLabel: 'Descubrir oferta',
  ctaHref: '/cuentas',
  variant: 'featured',
  eyebrow: 'Nueva clientela',
};

describe('PromotionCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromotionCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('pinta la variante featured por defecto del modelo', async () => {
    const fixture = TestBed.createComponent(PromotionCard);
    fixture.componentRef.setInput('promotion', promotion);
    await fixture.whenStable();

    const article = (fixture.nativeElement as HTMLElement).querySelector('.promo');
    expect(article?.getAttribute('data-variant')).toBe('featured');
    expect(fixture.nativeElement.textContent).toContain('Hasta 280 € de bienvenida');
  });

  it('permite sobrescribir la variante', async () => {
    const fixture = TestBed.createComponent(PromotionCard);
    fixture.componentRef.setInput('promotion', promotion);
    fixture.componentRef.setInput('variant', 'compact');
    await fixture.whenStable();

    expect(fixture.componentInstance.resolvedVariant()).toBe('compact');
  });
});
