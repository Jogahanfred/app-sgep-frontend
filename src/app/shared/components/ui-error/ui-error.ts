import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="err" role="alert">
      <svg class="err__icon" viewBox="0 0 16 14" aria-hidden="true">
        <path
          d="M7.15 1.35 1.2 11.4A1 1 0 0 0 2.05 13h11.9a1 1 0 0 0 .85-1.6L8.85 1.35a1 1 0 0 0-1.7 0Z"
          fill="#fde8e8"
          stroke="#b30000"
          stroke-width="1.1"
        />
        <path d="M8 5v3.2" stroke="#8b1e1e" stroke-width="1.35" stroke-linecap="round" />
        <circle cx="8" cy="10.2" r="0.55" fill="#8b1e1e" />
      </svg>
      <span>{{ message() }}</span>
    </p>
  `,
  styleUrl: './ui-error.scss',
})
export class UiError {
  readonly message = input.required<string>();
}
