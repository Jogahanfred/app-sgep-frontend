import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Product } from '@core/domain/entities';
import { ProductCard } from './product-card';

const product: Product = {
  id: 'cta',
  title: 'Cuenta Clara',
  description: 'Sin comisiones de mantenimiento.',
  category: 'account',
  badge: 'Nueva',
  features: ['Bizum'],
  ctaLabel: 'Abrir cuenta',
  ctaHref: '/cuentas',
};

describe('ProductCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza título, descripción y CTA', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cuenta Clara');
    expect(el.textContent).toContain('Sin comisiones de mantenimiento.');
    expect(el.textContent).toContain('Abrir cuenta');
    expect(el.textContent).toContain('Nueva');
  });

  it('emite el producto al pulsar la acción', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    const emitted: Product[] = [];
    fixture.componentInstance.action.subscribe((value) => emitted.push(value));
    await fixture.whenStable();

    fixture.componentInstance.onAction();
    expect(emitted[0]?.id).toBe('cta');
  });
});
