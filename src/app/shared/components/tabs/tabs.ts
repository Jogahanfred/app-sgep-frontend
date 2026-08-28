import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly tabs = input.required<TabItem[]>();
  readonly activeId = input.required<string>();
  readonly labelledBy = input<string | undefined>(undefined);
  readonly tabChange = output<string>();

  select(id: string): void {
    this.tabChange.emit(id);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    if (!tabs.length) return;

    const last = tabs.length - 1;
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;

    if (nextIndex === null) return;

    event.preventDefault();
    const next = tabs[nextIndex];
    if (!next) return;
    this.select(next.id);
    const root = (event.currentTarget as HTMLElement).parentElement;
    const buttons = root?.querySelectorAll('[role="tab"]');
    const target = buttons?.item(nextIndex);
    if (target instanceof HTMLButtonElement) {
      target.focus();
    }
  }
}
