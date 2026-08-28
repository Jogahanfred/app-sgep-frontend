import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  href?: string;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="bc" aria-label="Migas de pan">
      <ol>
        <li><a routerLink="/">Inicio</a></li>
        @for (crumb of crumbs(); track crumb.label) {
          <li>
            @if (crumb.href) {
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

    a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
    }

    a:hover {
      text-decoration: underline;
    }
  `,
})
export class Breadcrumb {
  readonly crumbs = input.required<Crumb[]>();
}
