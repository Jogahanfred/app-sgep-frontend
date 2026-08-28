import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EurPipe } from '@shared/pipes/eur.pipe';

export interface QuoteRow {
  label: string;
  value: string;
  strong?: boolean;
}

@Component({
  selector: 'app-quote-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EurPipe],
  template: `
    <aside class="qc">
      <p class="qc__kicker">{{ title() }}</p>
      @if (amount() !== null) {
        <p class="qc__amount">{{ amount() | eur }}</p>
        <ul class="qc__rows">
          @for (row of rows(); track row.label) {
            <li [class.qc__row--strong]="row.strong">
              <span>{{ row.label }}</span>
              <span>{{ row.value }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="qc__empty">{{ empty() }}</p>
      }
    </aside>
  `,
  styleUrl: './quote-card.scss',
})
export class QuoteCard {
  readonly title = input('Cuota mensual');
  readonly amount = input<number | null>(null);
  readonly rows = input<QuoteRow[]>([]);
  readonly empty = input('Ajusta importe y plazo para ver la cuota.');
}
