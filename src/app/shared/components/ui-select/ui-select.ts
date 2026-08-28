import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import type { ChoiceOption } from '@shared/models/choice.model';
import { UiError } from '../ui-error/ui-error';
import { Icon, type IconName } from '../icon/icon';

@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClickOutsideDirective, UiError, Icon],
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
  readonly placeholder = input('Seleccionar');
  readonly uppercase = input(true);
  readonly error = input<string | undefined>(undefined);
  readonly valueChange = output<string>();

  readonly open = signal(false);

  readonly selectedLabel = computed(() => {
    const match = this.options().find((option) => option.value === this.value());
    return match?.label ?? '';
  });

  toggle(): void {
    this.open.update((current) => !current);
  }

  close(): void {
    this.open.set(false);
  }

  pick(option: ChoiceOption): void {
    this.valueChange.emit(option.value);
    this.open.set(false);
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
