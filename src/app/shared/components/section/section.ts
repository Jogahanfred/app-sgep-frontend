import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from '../container/container';

@Component({
  selector: 'app-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container],
  template: `
    <section class="section" [class.section--alt]="tone() === 'alt'" [class.section--ink]="tone() === 'ink'" [attr.id]="sectionId() || null">
      <app-container [wide]="wide()">
        @if (eyebrow() || title()) {
          <header class="section__header">
            @if (eyebrow()) {
              <p class="section__eyebrow">{{ eyebrow() }}</p>
            }
            @if (title()) {
              <h2 class="section__title">{{ title() }}</h2>
            }
            @if (subtitle()) {
              <p class="section__subtitle">{{ subtitle() }}</p>
            }
          </header>
        }
        <ng-content />
      </app-container>
    </section>
  `,
  styleUrl: './section.scss',
})
export class Section {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly eyebrow = input<string | undefined>(undefined);
  readonly tone = input<'default' | 'alt' | 'ink'>('default');
  readonly sectionId = input<string | undefined>(undefined);
  readonly wide = input(false);
}
