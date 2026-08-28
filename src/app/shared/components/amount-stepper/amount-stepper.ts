import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatCompactEur } from '@shared/utils/format-eur';

@Component({
  selector: 'app-amount-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="as">
      <button type="button" class="as__btn" [disabled]="value() <= min()" (click)="nudge(-1)" [attr.aria-label]="'Restar ' + step()">
        −
      </button>
      <p class="as__value" [id]="id()">{{ display() }}</p>
      <button type="button" class="as__btn" [disabled]="value() >= max()" (click)="nudge(1)" [attr.aria-label]="'Sumar ' + step()">
        +
      </button>
    </div>
  `,
  styleUrl: './amount-stepper.scss',
})
export class AmountStepper {
  readonly id = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1000);
  readonly suffix = input('€');
  readonly valueChange = output<number>();

  readonly display = computed(() => {
    if (this.suffix() === '€') {
      return formatCompactEur(this.value());
    }
    return `${this.value().toLocaleString('es-ES')} ${this.suffix()}`;
  });

  nudge(direction: -1 | 1): void {
    const next = Math.min(this.max(), Math.max(this.min(), this.value() + direction * this.step()));
    this.valueChange.emit(next);
  }
}
