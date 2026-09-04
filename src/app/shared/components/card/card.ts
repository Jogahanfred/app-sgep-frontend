import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article class="card" [class.card--interactive]="interactive()" [class.card--padded]="padded()"><ng-content /></article>`,
  styles: `
    .card {
      height: 100%;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .card--interactive {
      transition:
        transform var(--duration-med) var(--ease-out),
        box-shadow var(--duration-med) var(--ease-out),
        border-color var(--duration-med) var(--ease-out);
    }

    .card--padded {
      padding: 1.25rem;
    }

    .card--interactive:hover {
      transform: translateY(-3px);
      border-color: rgb(11 61 56 / 22%);
      box-shadow: var(--shadow-md);
    }

    @media (prefers-reduced-motion: reduce) {
      .card--interactive:hover {
        transform: none;
      }
    }
  `,
})
export class Card {
  readonly interactive = input(true);
  readonly padded = input(false);
}
