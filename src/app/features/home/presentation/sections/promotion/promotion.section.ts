import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Promotion } from '@core/domain/entities';
import { PromotionCard } from '@shared/components/promotion-card/promotion-card';
import { Section } from '@shared/components/section/section';

@Component({
  selector: 'app-promotion-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, PromotionCard],
  template: `
    <app-section
      eyebrow="Promociones"
      title="Ventajas que se entienden"
      subtitle="Bonificaciones ficticias, escritas como lo haría un banco real: con condiciones a la vista."
      sectionId="promociones"
    >
      <div class="promo-grid">
        @for (promo of promotions(); track promo.id) {
          <app-promotion-card [promotion]="promo" />
        }
      </div>
    </app-section>
  `,
  styles: `
    .promo-grid {
      display: grid;
      gap: var(--spacing-lg);
    }

    @media (min-width: 900px) {
      .promo-grid {
        grid-template-columns: 1.4fr 1fr 1fr;
      }
    }
  `,
})
export class PromotionSection {
  readonly promotions = input.required<Promotion[]>();
}
