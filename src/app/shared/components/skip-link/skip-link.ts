import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-skip-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="skip" href="#contenido-principal">Saltar al contenido principal</a>`,
  styles: `
    .skip {
      position: absolute;
      left: var(--spacing-md);
      top: 0;
      z-index: 100;
      transform: translateY(-140%);
      padding: 0.6rem 1rem;
      background: var(--color-primary);
      color: var(--color-text-inverse);
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      font-weight: 600;
      text-decoration: none;
    }

    .skip:focus {
      transform: translateY(0);
    }
  `,
})
export class SkipLink {}
