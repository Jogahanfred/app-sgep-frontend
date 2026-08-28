import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'ui-range-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rs">
      <input
        class="rs__input"
        type="range"
        [id]="id()"
        [attr.aria-label]="ariaLabel()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        [style.--pct]="percent()"
        (input)="onInput($event)"
      />
      @if (minLabel() || maxLabel()) {
        <div class="rs__meta">
          <span>{{ minLabel() }}</span>
          <span>{{ maxLabel() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './ui-range-slider.scss',
})
export class UiRangeSlider {
  readonly id = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly ariaLabel = input.required<string>();
  readonly minLabel = input<string | undefined>(undefined);
  readonly maxLabel = input<string | undefined>(undefined);
  readonly valueChange = output<number>();

  readonly percent = computed(() => {
    const span = this.max() - this.min();
    if (span <= 0) return '0%';
    const ratio = (this.value() - this.min()) / span;
    return `${Math.min(100, Math.max(0, ratio * 100))}%`;
  });

  onInput(event: Event): void {
    const next = Number((event.target as HTMLInputElement).value);
    this.valueChange.emit(next);
  }
}
