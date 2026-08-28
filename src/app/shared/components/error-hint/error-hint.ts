import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="err" role="alert">
      <span class="err__icon" aria-hidden="true">
        <span class="err__bang">!</span>
      </span>
      <span>{{ message() }}</span>
    </p>
  `,
  styleUrl: './error-hint.scss',
})
export class ErrorHint {
  readonly message = input.required<string>();
}
