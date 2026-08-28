import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'arrow-right'
  | 'menu'
  | 'close'
  | 'check'
  | 'user'
  | 'wallet'
  | 'credit'
  | 'home'
  | 'trend'
  | 'card'
  | 'pin'
  | 'help'
  | 'calendar'
  | 'chevron'
  | 'external';

const PATHS: Record<IconName, string> = {
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 1 0-14 0',
  wallet: 'M4 8h16v11H4zM4 8V6a2 2 0 0 1 2-2h12M16 13h2',
  credit: 'M4 7h16v11H4zM4 11h16',
  home: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  trend: 'M4 16l5-5 4 3 7-8M14 6h6v6',
  card: 'M3 8h18v10H3zM3 12h18',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  help: 'M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1.1-1.4 2v.2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  calendar: 'M7 4v3M17 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v11H4V8a2 2 0 0 1 2-2Z',
  chevron: 'M6 9l6 6 6-6',
  external: 'M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6v6M10 14 20 4',
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 24 24'"
      [attr.aria-hidden]="decorative() ? 'true' : null"
      [attr.role]="decorative() ? null : 'img'"
      [attr.aria-label]="label() || null"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      flex-shrink: 0;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly label = input<string>('');
  readonly decorative = input(true);
  readonly path = computed(() => PATHS[this.name()]);
}
