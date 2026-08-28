import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="container" [class.container--wide]="wide()"><ng-content /></div>`,
  styles: `
    .container {
      width: min(100% - 2rem, var(--container-max-width));
      margin-inline: auto;
    }

    .container--wide {
      width: min(100% - 2rem, var(--container-wide));
    }

    @media (min-width: 768px) {
      .container {
        width: min(100% - 3rem, var(--container-max-width));
      }

      .container--wide {
        width: min(100% - 3rem, var(--container-wide));
      }
    }
  `,
})
export class Container {
  readonly wide = input(false);
}
