import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-media-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <article class="mf">
      <img class="mf__img" [src]="image()" [alt]="imageAlt()" width="1200" height="720" />
      <div class="mf__card">
        @if (eyebrow()) {
          <p class="mf__eyebrow">{{ eyebrow() }}</p>
        }
        <h3>{{ title() }}</h3>
        <p class="mf__desc">{{ description() }}</p>
        <app-button [href]="ctaHref()" variant="secondary">{{ ctaLabel() }}</app-button>
      </div>
    </article>
  `,
  styles: `
    .mf {
      position: relative;
      display: grid;
      min-height: 20rem;
      overflow: hidden;
      border-radius: 1.75rem;
      background: var(--color-surface-alt);
    }

    .mf__img {
      width: 100%;
      height: 16rem;
      object-fit: cover;
    }

    .mf__card {
      margin: var(--spacing-lg);
      padding: var(--spacing-xl);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
    }

    .mf__eyebrow {
      color: var(--color-text-secondary);
      font-size: var(--fs-sm);
      margin-bottom: 0.4rem;
    }

    .mf h3 {
      font-size: var(--fs-2xl);
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .mf__desc {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    @media (min-width: 900px) {
      .mf {
        grid-template-columns: 1fr 22rem;
        align-items: stretch;
      }

      .mf__img {
        height: 100%;
        min-height: 22rem;
      }

      .mf__card {
        margin: 1.5rem 1.5rem 1.5rem 0;
        align-self: center;
      }
    }
  `,
})
export class MediaFeature {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly eyebrow = input<string | undefined>(undefined);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly ctaLabel = input.required<string>();
  readonly ctaHref = input.required<string>();
}
