import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-calc-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="cp"><ng-content /></div>`,
  styles: `
    :host {
      display: block;
    }

    .cp {
      padding: 1.6rem 1.4rem 1.8rem;
      background: var(--color-peach);
      border-radius: 1rem;
    }

    @media (min-width: 768px) {
      .cp {
        padding: 2rem 2.1rem 2.15rem;
      }
    }
  `,
})
export class UiCalcPanel {}
