import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a class="link" [routerLink]="href()" [attr.aria-label]="ariaLabel()">
      <ng-content />
    </a>
  `,
  styles: `
    .link {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 0.18em;
    }

    .link:hover {
      color: var(--color-primary-light);
    }
  `,
})
export class TextLink {
  readonly href = input.required<string>();
  readonly ariaLabel = input<string | undefined>(undefined);
}
