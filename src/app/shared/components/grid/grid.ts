import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="grid" [style.--cols]="columns()"><ng-content /></div>`,
  styles: `
    .grid {
      display: grid;
      gap: var(--spacing-lg);
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      .grid {
        grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
      }
    }
  `,
})
export class Grid {
  readonly columns = input(3);
}
