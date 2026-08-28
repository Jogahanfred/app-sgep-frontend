import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NeedId, NeedOption } from '@core/domain/entities';
import { NeedCard } from '@shared/components/need-card/need-card';
import { Section } from '@shared/components/section/section';
import type { IconName } from '@shared/components/icon/icon';

const NEED_HREF: Record<NeedId, string> = {
  daily: '/cuentas',
  protect: '/tarjetas',
  home: '/hipotecas',
  save: '/inversion',
  finance: '/prestamos',
  insure: '/hazte-cliente',
};

@Component({
  selector: 'app-need-selector-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, NeedCard],
  template: `
    <app-section title="Cuéntanos, ¿qué necesitas?" align="center" tone="muted" sectionId="necesitas">
      <div class="needs">
        @for (option of options(); track option.id) {
          <app-need-card [label]="option.label" [href]="hrefFor(option.id)" [icon]="iconFor(option.icon)" />
        }
      </div>
    </app-section>
  `,
  styles: `
    .needs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-md);
    }

    @media (min-width: 768px) {
      .needs {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (min-width: 1100px) {
      .needs {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }
  `,
})
export class NeedSelectorSection {
  readonly options = input.required<NeedOption[]>();

  hrefFor(id: NeedId): string {
    return NEED_HREF[id];
  }

  iconFor(name: string): IconName {
    const allowed: IconName[] = ['wallet', 'card', 'home', 'trend', 'credit', 'shield'];
    return allowed.includes(name as IconName) ? (name as IconName) : 'wallet';
  }
}
