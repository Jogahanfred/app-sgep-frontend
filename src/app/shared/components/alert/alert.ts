import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert" [class]="'alert--' + tone()" role="alert">
      <ng-content />
    </div>
  `,
  styles: `
    .alert {
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      font-size: var(--fs-sm);
    }

    .alert--error {
      background: #f8ece9;
      border-color: #e3b8b1;
      color: var(--color-error);
    }

    .alert--empty {
      background: var(--color-surface-alt);
      color: var(--color-text-secondary);
    }

    .alert--success {
      background: #e8f4ec;
      border-color: #b7d8c4;
      color: var(--color-success);
    }
  `,
})
export class Alert {
  readonly tone = input<'error' | 'empty' | 'success'>('empty');
}
