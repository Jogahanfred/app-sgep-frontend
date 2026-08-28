import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetProductsByNeed } from '@core/application';
import type { NeedOption, Product } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { Grid } from '@shared/components/grid/grid';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Section } from '@shared/components/section/section';
import { Skeleton } from '@shared/components/skeleton/skeleton';
import { Tabs, type TabItem } from '@shared/components/tabs/tabs';

@Component({
  selector: 'app-need-selector-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Tabs, ProductCard, Grid, Alert, Skeleton],
  template: `
    <app-section
      eyebrow="Cuéntanos"
      title="¿Qué necesitas ahora?"
      subtitle="Elige un motivo y te mostramos el producto que encaja, sin ruido."
      sectionId="necesitas"
    >
      <app-tabs [tabs]="tabItems()" [activeId]="activeNeed()" labelledBy="necesitas" (tabChange)="onNeed($event)" />
      @if (status() === 'loading') {
        <div class="need-sk">
          <app-skeleton height="12rem" />
          <app-skeleton height="12rem" />
        </div>
      } @else if (status() === 'error') {
        <app-alert tone="error">No hemos podido cargar estas soluciones. Inténtalo de nuevo.</app-alert>
      } @else if (!products().length) {
        <app-alert>No hay productos para esta necesidad en este momento.</app-alert>
      } @else {
        <div class="need-grid">
          <app-grid [columns]="2">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          </app-grid>
        </div>
      }
    </app-section>
  `,
  styles: `
    app-tabs {
      display: block;
      margin-bottom: var(--spacing-xl);
    }

    .need-sk,
    .need-grid {
      margin-top: var(--spacing-lg);
    }

    .need-sk {
      display: grid;
      gap: var(--spacing-lg);
    }
  `,
})
export class NeedSelectorSection {
  private readonly getByNeed = inject(GetProductsByNeed);
  private readonly destroyRef = inject(DestroyRef);
  readonly options = input.required<NeedOption[]>();
  readonly activeNeed = signal('daily');
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.load('daily');
  }

  tabItems(): TabItem[] {
    return this.options().map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description,
    }));
  }

  onNeed(id: string): void {
    this.activeNeed.set(id);
    this.load(id as NeedOption['id']);
  }

  private load(id: NeedOption['id']): void {
    this.status.set('loading');
    this.getByNeed
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.products.set(items);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
