import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { HelpTopic } from '@core/domain/entities';
import { Card } from '@shared/components/card/card';
import { Icon, type IconName } from '@shared/components/icon/icon';
import { TextLink } from '@shared/components/link/link';
import { Section } from '@shared/components/section/section';

@Component({
  selector: 'app-help-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Card, TextLink, Icon],
  template: `
    <app-section title="¿Necesitas ayuda?" subtitle="Estamos en contacto" align="center" tone="warm" sectionId="ayuda">
      <div class="help">
        @for (topic of topics(); track topic.id) {
          <app-card [interactive]="false">
            <div class="help__card">
              <app-icon [name]="asIcon(topic.icon)" />
              <h3>{{ topic.title }}</h3>
              <p>{{ topic.description }}</p>
              <app-link [href]="topic.ctaHref">{{ topic.ctaLabel }}</app-link>
            </div>
          </app-card>
        }
      </div>
    </app-section>
  `,
  styles: `
    .help {
      display: grid;
      gap: var(--spacing-lg);
    }

    @media (min-width: 768px) {
      .help {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    .help__card {
      display: grid;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl);
    }

    .help__card h3 {
      font-weight: 800;
    }

    .help__card p {
      color: var(--color-text-secondary);
      font-size: var(--fs-sm);
    }

    .help__card app-icon {
      width: 1.75rem;
      height: 1.75rem;
      color: var(--color-text);
    }
  `,
})
export class HelpSection {
  readonly topics = input.required<HelpTopic[]>();

  asIcon(name: string): IconName {
    const allowed: IconName[] = ['pin', 'help', 'calendar', 'wallet', 'shield'];
    return allowed.includes(name as IconName) ? (name as IconName) : 'help';
  }
}
