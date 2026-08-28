import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="sk" [style.height]="height()" [attr.aria-hidden]="true"></div>`,
  styles: `
    .sk {
      border-radius: var(--radius-md);
      background: linear-gradient(90deg, #ebe6dc 0%, #f7f3ea 50%, #ebe6dc 100%);
      background-size: 200% 100%;
      animation: shimmer 1.2s linear infinite;
    }

    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sk {
        animation: none;
      }
    }
  `,
})
export class Skeleton {
  readonly height = input('8rem');
}
