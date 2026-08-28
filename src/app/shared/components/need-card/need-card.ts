import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, type IconName } from '../icon/icon';

@Component({
  selector: 'app-need-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <a class="need" [routerLink]="href()">
      <app-icon [name]="icon()" />
      <span class="need__label">{{ label() }}</span>
      <app-icon name="arrow-right" class="need__go" />
    </a>
  `,
  styles: `
    .need {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      min-height: 9.5rem;
      padding: 1.25rem 0.75rem 1.5rem;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      text-align: center;
      color: var(--color-text);
      transition: box-shadow var(--duration-fast) var(--ease-out);
    }

    .need:hover {
      box-shadow: var(--shadow-md);
    }

    .need app-icon:first-child {
      width: 2rem;
      height: 2rem;
      color: var(--color-primary);
    }

    .need__label {
      font-weight: 600;
      font-size: var(--fs-sm);
    }

    .need__go {
      position: absolute;
      right: 0.85rem;
      bottom: 0.85rem;
      width: 1rem;
      height: 1rem;
      color: var(--color-primary);
    }
  `,
})
export class NeedCard {
  readonly label = input.required<string>();
  readonly href = input.required<string>();
  readonly icon = input.required<IconName>();
}
