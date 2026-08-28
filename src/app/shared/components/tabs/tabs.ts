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

    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    this.select(tabs[next].id);
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[next]?.focus();
  }
}
