import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith } from 'rxjs';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { Icon } from '../icon/icon';
import { UiError } from '../ui-error/ui-error';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';

export type DatePickerView = 'days' | 'months' | 'years';

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

const WEEKDAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function formatIsoDateEs(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function startOfGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  return new Date(year, month, 1 - mondayIndex);
}

@Component({
  selector: 'ui-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClickOutsideDirective, Icon, UiError, UiFieldLabel],
  templateUrl: './ui-date-picker.html',
  styleUrl: './ui-date-picker.scss',
})
export class UiDatePicker {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly field = input.required<FormControl<string>>();
  readonly error = input<string | undefined>(undefined);
  readonly info = input<string | undefined>(undefined);
  readonly minYear = input(1920);
  readonly maxYear = input(new Date().getFullYear());

  readonly weekdays = WEEKDAYS;
  readonly monthsShort = MONTHS_SHORT;
  readonly open = signal(false);
  readonly view = signal<DatePickerView>('days');
  readonly cursor = signal(UiDatePicker.initialCursor());
  readonly todayIso = toIsoDate(new Date());
  private readonly controlValue = signal('');

  readonly displayValue = computed(() => formatIsoDateEs(this.controlValue()));
  readonly selectedIso = computed(() => this.controlValue());

  constructor() {
    effect((onCleanup) => {
      const control = this.field();
      const sub = control.valueChanges.pipe(startWith(control.value)).subscribe((value) => {
        this.controlValue.set(value);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly title = computed(() => {
    const { year, month } = this.cursor();
    if (this.view() === 'years') {
      const start = this.yearWindowStart();
      return `${start} – ${start + 11}`;
    }
    if (this.view() === 'months') return String(year);
    return `${MONTHS[month]} de ${year}`;
  });

  readonly cells = computed<CalendarCell[]>(() => {
    const { year, month } = this.cursor();
    const start = startOfGrid(year, month);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return {
        iso: toIsoDate(date),
        day: date.getDate(),
        inMonth: date.getMonth() === month,
      };
    });
  });

  readonly years = computed(() => {
    const start = this.yearWindowStart();
    return Array.from({ length: 12 }, (_, index) => start + index);
  });

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.syncCursorFromValue();
    this.view.set('days');
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.view.set('days');
  }

  step(delta: number): void {
    const current = this.cursor();
    if (this.view() === 'years') {
      this.cursor.set({ ...current, year: this.clampYear(current.year + delta * 12) });
      return;
    }
    if (this.view() === 'months') {
      this.cursor.set({ ...current, year: this.clampYear(current.year + delta) });
      return;
    }
    const next = new Date(current.year, current.month + delta, 1);
    this.cursor.set({ year: this.clampYear(next.getFullYear()), month: next.getMonth() });
  }

  liftView(): void {
    if (this.view() === 'days') this.view.set('months');
    else if (this.view() === 'months') this.view.set('years');
  }

  pickYear(year: number): void {
    this.cursor.set({ ...this.cursor(), year: this.clampYear(year) });
    this.view.set('months');
  }

  pickMonth(month: number): void {
    this.cursor.set({ ...this.cursor(), month });
    this.view.set('days');
  }

  pickDay(iso: string): void {
    this.field().setValue(iso);
    this.field().markAsTouched();
    this.close();
  }

  clear(): void {
    this.field().setValue('');
    this.field().markAsTouched();
    this.close();
  }

  pickToday(): void {
    const today = new Date();
    const year = this.clampYear(today.getFullYear());
    this.cursor.set({ year, month: today.getMonth() });
    this.pickDay(toIsoDate(today));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  private yearWindowStart(): number {
    const year = this.cursor().year;
    return year - (year % 12);
  }

  private clampYear(year: number): number {
    return Math.min(this.maxYear(), Math.max(this.minYear(), year));
  }

  private syncCursorFromValue(): void {
    const parsed = parseIsoDate(this.field().value) ?? new Date();
    this.cursor.set({ year: this.clampYear(parsed.getFullYear()), month: parsed.getMonth() });
  }

  private static initialCursor(): { year: number; month: number } {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }
}
