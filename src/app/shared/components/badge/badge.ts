import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class.badge--accent]="accent()"><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-pill);
      background: var(--color-surface-alt);
      color: var(--color-primary);
      font-size: var(--fs-xs);
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .badge--accent {
      background: rgb(196 163 90 / 18%);
      color: var(--color-secondary-dark);
    }
  `,
})
export class Badge {
  readonly accent = input(false);
}
