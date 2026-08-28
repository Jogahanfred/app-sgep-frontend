import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import type { ChoiceOption } from '@shared/models/choice.model';
import { UiError } from '../ui-error/ui-error';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';
import { Icon, type IconName } from '../icon/icon';

export type UiSelectSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClickOutsideDirective, UiError, UiFieldLabel, Icon],
  templateUrl: './ui-select.html',
  styleUrl: './ui-select.scss',
})
export class UiSelect {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<ChoiceOption[]>();
  readonly value = input('');
  readonly title = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly leadingIcon = input<IconName | undefined>(undefined);
  readonly placeholder = input('Seleccione');
  readonly uppercase = input(true);
  readonly error = input<string | undefined>(undefined);
  readonly size = input<UiSelectSize>('md');
  readonly subLabel = input('');
  readonly required = input(false);
  readonly loading = input(false);
  readonly filter = input(false);
  readonly disabled = input(false);
  readonly emptyMessage = input('No hay items cargados.');
  readonly emptyFilterMessage = input('No se encontraron resultados.');
  readonly valueChange = output<string>();

  readonly open = signal(false);
  readonly filterQuery = signal('');

  readonly selectedLabel = computed(() => {
    const match = this.options().find((option) => option.value === this.value());
    return match?.label ?? '';
  });

  readonly visibleOptions = computed(() => {
    const query = this.filterQuery().trim().toLowerCase();
    const items = this.options();
    if (!query) return items;
    return items.filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly emptyCopy = computed(() =>
    this.filterQuery().trim() ? this.emptyFilterMessage() : this.emptyMessage(),
  );

  toggle(): void {
    if (this.disabled() || this.loading()) return;
    this.open.update((current) => !current);
    if (!this.open()) this.filterQuery.set('');
  }

  close(): void {
    this.open.set(false);
    this.filterQuery.set('');
  }

  pick(option: ChoiceOption): void {
    if (this.disabled() || this.loading()) return;
    this.valueChange.emit(option.value);
    this.close();
  }

  onFilter(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
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
}
