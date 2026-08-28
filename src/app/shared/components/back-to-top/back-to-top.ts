import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ScrollChrome } from '@layout/scroll-chrome.service';
import { Icon } from '../icon/icon';
import { animateScrollToTop } from '../../utils/scroll-to';

@Component({
  selector: 'app-back-to-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="top"
      [class.top--visible]="chrome.headerHidden()"
      aria-label="Volver arriba"
      (click)="goTop()"
    >
      <app-icon name="arrow-up" />
    </button>
  `,
  styles: `
    .top {
      position: fixed;
      right: calc(1.25rem + var(--scroll-lock-gap, 0px));
      bottom: 1.25rem;
      z-index: 45;
      display: grid;
      place-items: center;
      width: 3.15rem;
      height: 3.15rem;
      border: 0;
      border-radius: 50%;
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 8px 22px rgb(0 0 0 / 12%);
      opacity: 0;
      visibility: hidden;
      transform: translateY(0.6rem) scale(0.92);
      pointer-events: none;
      transition:
        opacity var(--duration-med) var(--ease-out),
        transform var(--duration-med) var(--ease-out),
        visibility var(--duration-med);
    }

    .top--visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .top:hover {
      transform: translateY(-2px) scale(1);
    }

    .top app-icon {
      width: 1.35rem;
      height: 1.35rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .top,
      .top--visible,
      .top:hover {
        transition: none;
        transform: none;
      }
    }
  `,
})
export class BackToTop {
  readonly chrome = inject(ScrollChrome);
  private readonly destroyRef = inject(DestroyRef);
  private stopScroll: (() => void) | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopScroll?.());
  }

  goTop(): void {
    this.stopScroll?.();
    this.stopScroll = animateScrollToTop();
  }
}
