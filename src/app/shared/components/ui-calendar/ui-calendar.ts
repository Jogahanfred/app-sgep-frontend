import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';
import { UiError } from '../ui-error/ui-error';

interface CalendarDay { iso: string; day: number; outside: boolean; }

@Component({
  selector: 'ui-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiFieldLabel, UiError],
  template: `
    <div class="calendar">
      <ui-field-label [label]="label()" [forId]="id()" />
      <div class="calendar__shell">
        <div class="calendar__header">
          <button type="button" aria-label="Mes anterior" (click)="move(-1)">&lsaquo;</button>
          <strong>{{ monthLabel() }}</strong>
          <button type="button" aria-label="Mes siguiente" (click)="move(1)">&rsaquo;</button>
        </div>
        <div class="calendar__week">@for (day of weekdays; track day) { <span>{{ day }}</span> }</div>
        <div class="calendar__grid" role="grid">
          @for (day of days(); track day.iso) {
            <button type="button" role="gridcell" [class.calendar__day--outside]="day.outside" [class.calendar__day--selected]="day.iso === field().value" [attr.aria-selected]="day.iso === field().value" (click)="pick(day.iso)">{{ day.day }}</button>
          }
        </div>
      </div>
      @if (error(); as message) { <ui-error [message]="message" /> }
    </div>
  `,
  styles: `
    :host { display: block; }
    .calendar { display: grid; gap: 0; }
    .calendar__shell { border: 1px solid #e4e4e4; border-radius: 8px; background: #fff; padding: 1rem; }
    .calendar__header { display: grid; grid-template-columns: 2.5rem 1fr 2.5rem; align-items: center; gap: 1rem; margin-bottom: 1rem; text-align: center; }
    .calendar__header strong { color: #333; font-size: 1rem; }
    .calendar__header button { width: 2.5rem; height: 2.5rem; border: 1px solid #e4e4e4; border-radius: 50%; background: #fff; color: var(--color-control); cursor: pointer; font-size: 1.5rem; line-height: 1; }
    .calendar__week, .calendar__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .35rem; }
    .calendar__week { margin-bottom: .35rem; color: #777; font-size: .72rem; font-weight: 700; text-align: center; text-transform: uppercase; }
    .calendar__grid button { min-height: 2.75rem; border: 1px solid transparent; border-radius: 6px; background: transparent; color: #222; cursor: pointer; font: inherit; }
    .calendar__grid button:hover { background: var(--color-control-soft); }
    .calendar__grid .calendar__day--outside { color: #aaa; }
    .calendar__grid .calendar__day--selected { border-color: var(--color-primary); background: var(--color-primary); color: #fff; font-weight: 700; }
  `,
})
export class UiCalendar {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly field = input.required<FormControl<string>>();
  readonly error = input<string | undefined>(undefined);
  readonly valueChange = output<string>();
  readonly weekdays = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
  readonly cursor = input(new Date());
  readonly current = computed(() => this.parse(this.field().value) ?? new Date());
  readonly monthLabel = computed(() => this.current().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
  readonly days = computed<CalendarDay[]>(() => {
    const date = this.current();
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(date.getFullYear(), date.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { iso: this.iso(day), day: day.getDate(), outside: day.getMonth() !== date.getMonth() };
    });
  });
  move(delta: number): void { const date = this.current(); this.field().setValue(this.iso(new Date(date.getFullYear(), date.getMonth() + delta, 1))); }
  pick(value: string): void { this.field().setValue(value); this.field().markAsTouched(); this.valueChange.emit(value); }
  private iso(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  private parse(value: string): Date | null { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null; }
}
