import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-form-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="fc"><ng-content /></div>`,
  styles: `
    :host {
      display: block;
    }

    .fc {
      overflow: visible;
      padding: 1.5rem 1.4rem 1.6rem;
      background: #fff;
      border: 1px solid var(--color-border-subtle);
      border-radius: 0.75rem;
    }
  `,
})
export class UiFormCard {}
