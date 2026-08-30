import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '../button/button';
import { animateScrollIntoView } from '@shared/utils/scroll-to';

export interface CoachStep {
  title: string;
  body: string;
  eyebrow: string;
  target: string | null;
}

interface HoleBox {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

interface TipBox {
  top: number;
  left: number;
}

const PAD = 8;
const TIP_GAP = 12;
const TIP_WIDTH = 320;
const TIP_FALLBACK_H = 200;

@Component({
  selector: 'ui-guided-tour',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './ui-guided-tour.html',
  styleUrl: './ui-guided-tour.scss',
})
export class UiGuidedTour {
  private readonly destroyRef = inject(DestroyRef);
  private cancelScroll: (() => void) | null = null;
  private raf = 0;
  private tries = 0;

  readonly open = input(false);
  readonly step = input<CoachStep | null>(null);
  readonly index = input(0);
  readonly total = input(0);
  readonly isFirst = input(false);
  readonly isLast = input(false);
  readonly next = output<void>();
  readonly prev = output<void>();
  readonly skip = output<void>();

  readonly hole = signal<HoleBox | null>(null);
  readonly tip = signal<TipBox | null>(null);

  constructor() {
    const onResize = () => this.queueAlign(false);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      this.cancelScroll?.();
      cancelAnimationFrame(this.raf);
    });

    effect(() => {
      const open = this.open();
      const step = this.step();
      if (!open || !step?.target) {
        this.hole.set(null);
        this.tip.set(null);
        this.tries = 0;
        return;
      }
      this.tries = 0;
      this.tip.set(this.centerTip());
      this.queueAlign(true);
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.skip.emit();
    }
  }

  clipPath(): string | null {
    const hole = this.hole();
    if (!hole) return null;
    const x = hole.left;
    const y = hole.top;
    const r = x + hole.width;
    const b = y + hole.height;
    return `polygon(evenodd, 0px 0px, 100vw 0px, 100vw 100vh, 0px 100vh, 0px 0px, ${x}px ${y}px, ${x}px ${b}px, ${r}px ${b}px, ${r}px ${y}px, ${x}px ${y}px)`;
  }

  private queueAlign(scroll: boolean): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      this.raf = requestAnimationFrame(() => this.align(scroll));
    });
  }

  private align(scroll: boolean): void {
    const target = this.step()?.target;
    if (!this.open() || !target) return;
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!(el instanceof HTMLElement) || !el.getClientRects().length) {
      this.tries += 1;
      this.hole.set(null);
      this.tip.set(this.centerTip());
      if (this.tries < 12) this.queueAlign(scroll);
      return;
    }

    this.tries = 0;
    if (scroll) {
      this.cancelScroll?.();
      this.cancelScroll = animateScrollIntoView(el, 112, () => this.place(el));
      return;
    }
    this.place(el);
  }

  private place(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const radius = this.readRadius(el);
    const hole: HoleBox = {
      top: Math.max(8, rect.top - PAD),
      left: Math.max(8, rect.left - PAD),
      width: Math.max(32, rect.width + PAD * 2),
      height: Math.max(32, rect.height + PAD * 2),
      radius,
    };
    if (hole.left + hole.width > window.innerWidth - 8) {
      hole.width = Math.max(32, window.innerWidth - 16 - hole.left);
    }
    if (hole.top + hole.height > window.innerHeight - 8) {
      hole.height = Math.max(32, window.innerHeight - 16 - hole.top);
    }
    this.hole.set(hole);
    this.tip.set(this.placeTip(hole));
  }

  private readRadius(el: HTMLElement): number {
    const raw = getComputedStyle(el).borderRadius.split(' ')[0] ?? '';
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value + 4 : 16;
  }

  private placeTip(hole: HoleBox): TipBox {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(TIP_WIDTH, vw - 24);
    const height = TIP_FALLBACK_H;
    const spots = [
      { top: hole.top + hole.height + TIP_GAP, left: hole.left },
      { top: hole.top - height - TIP_GAP, left: hole.left },
      { top: hole.top, left: hole.left + hole.width + TIP_GAP },
      { top: hole.top, left: hole.left - width - TIP_GAP },
    ];
    const fit = spots.find(
      (spot) => spot.top >= 12 && spot.left >= 12 && spot.top + height <= vh - 12 && spot.left + width <= vw - 12,
    );
    const chosen = fit ?? spots[0];
    return {
      top: Math.min(Math.max(12, chosen.top), Math.max(12, vh - height - 12)),
      left: Math.min(Math.max(12, chosen.left), Math.max(12, vw - width - 12)),
    };
  }

  private centerTip(): TipBox {
    return {
      top: Math.max(24, window.innerHeight / 2 - TIP_FALLBACK_H / 2),
      left: Math.max(12, window.innerWidth / 2 - Math.min(TIP_WIDTH, window.innerWidth - 24) / 2),
    };
  }
}
