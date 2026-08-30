import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  href?: string;
  action?: string;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="bc" aria-label="Migas de pan">
      <ol>
        @if (includeHome()) {
          <li><a routerLink="/">Inicio</a></li>
        }
        @for (crumb of crumbs(); track crumb.label) {
          <li>
            @if (crumb.action) {
              <button type="button" (click)="navigated.emit(crumb.action)">{{ crumb.label }}</button>
            } @else if (crumb.href) {
              <a [routerLink]="crumb.href">{{ crumb.label }}</a>
            } @else {
              <span aria-current="page">{{ crumb.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .bc {
      font-size: var(--fs-sm);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      list-style: none;
    }

    li:not(:last-child)::after {
      content: '/';
      margin-left: 0.35rem;
      opacity: 0.6;
    }

    a,
    button {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
    }

    button {
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      font: inherit;
    }

    a:hover,
    button:hover {
      text-decoration: underline;
    }
  `,
})
export class Breadcrumb {
  readonly crumbs = input.required<Crumb[]>();
  readonly includeHome = input(true);
  readonly navigated = output<string>();
}
