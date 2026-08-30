import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

export interface UiPickItem {
  id: string;
  title: string;
  hint?: string;
  meta?: string;
  actionDisabled?: boolean;
}

@Component({
  selector: 'ui-pick-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    @if (items().length) {
      <ul class="pl">
        @for (item of items(); track item.id) {
          <li class="pl__row" [class.pl__row--on]="isChecked(item.id)">
            @if (selectable()) {
              <label class="pl__pick">
                <input
                  type="checkbox"
                  [checked]="isChecked(item.id)"
                  [attr.aria-label]="'Seleccionar ' + item.title"
                  (change)="toggle(item.id)"
                />
              </label>
            }
            <div class="pl__text">
              <p class="pl__title">{{ item.title }}</p>
              @if (item.hint) {
                <p class="pl__hint">{{ item.hint }}</p>
              }
              @if (item.meta) {
                <p class="pl__meta">{{ item.meta }}</p>
              }
            </div>
            <app-button
              type="button"
              size="xs"
              [disabled]="!!item.actionDisabled"
              (click)="actionClick.emit(item.id)"
            >
              {{ actionLabel() }}
            </app-button>
          </li>
        }
      </ul>
    } @else {
      <p class="pl__empty">{{ emptyTitle() }}</p>
    }
  `,
  styleUrl: './ui-pick-list.scss',
})
export class UiPickList {
  readonly items = input.required<UiPickItem[]>();
  readonly selectable = input(true);
  readonly checkedIds = input<readonly string[]>([]);
  readonly actionLabel = input('Añadir');
  readonly emptyTitle = input('No hay resultados.');
  readonly checkedIdsChange = output<string[]>();
  readonly actionClick = output<string>();

  isChecked(id: string): boolean {
    return this.checkedIds().includes(id);
  }

  toggle(id: string): void {
    const current = this.checkedIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    this.checkedIdsChange.emit(next);
  }
}
