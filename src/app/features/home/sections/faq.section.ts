import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FaqItem } from '@core/domain/entities';
import { Accordion } from '@shared/components/accordion/accordion';
import { Section } from '@shared/components/section/section';

@Component({
  selector: 'app-faq-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Accordion],
  template: `
    <app-section
      eyebrow="Preguntas frecuentes"
      title="Antes de llamar, léelo aquí"
      subtitle="Respuestas cortas sobre cuentas, préstamos, hipotecas e inversión."
      sectionId="preguntas-frecuentes"
    >
      <app-accordion [items]="items()" />
    </app-section>
  `,
})
export class FaqSection {
  readonly items = input.required<FaqItem[]>();
}
