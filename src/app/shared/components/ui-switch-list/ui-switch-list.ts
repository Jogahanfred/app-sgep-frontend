import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiToggle } from '../ui-toggle/ui-toggle';
import type { UiSwitchListItem } from '@shared/types/ui-switch-list.types';

@Component({
  selector: 'ui-switch-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiToggle],
  templateUrl: './ui-switch-list.html',
  styleUrl: './ui-switch-list.scss',
})
export class UiSwitchList {
  readonly items = input.required<readonly UiSwitchListItem[]>();
  readonly enabledIds = input<readonly string[]>([]);
  readonly disabled = input(false);
  readonly emptyTitle = input('No hay cursos.');
  readonly enabledIdsChange = output<string[]>();

  isEnabled(id: string): boolean {
    return this.enabledIds().includes(id);
  }

  toggle(id: string, enabled: boolean): void {
    if (this.disabled()) return;
    const current = this.enabledIds();
    const next = enabled ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id);
    this.enabledIdsChange.emit(next);
  }
}
