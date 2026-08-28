import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface StepItem {
  label: string;
}

@Component({
  selector: 'ui-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="sr" [attr.aria-label]="label()">
      @for (step of steps(); track step.label; let i = $index) {
        <li
          class="sr__item"
          [class.sr__item--on]="current() === i + 1"
          [class.sr__item--done]="current() > i + 1"
        >
          <span class="sr__num">{{ i + 1 }}</span>
          <span class="sr__name">{{ step.label }}</span>
        </li>
      }
    </ol>
  `,
  styleUrl: './ui-steps.scss',
})
export class UiSteps {
  readonly steps = input.required<StepItem[]>();
  readonly current = input(1);
  readonly label = input('Progreso');
}
