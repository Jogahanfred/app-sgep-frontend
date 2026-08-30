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
import { placeCoachTip } from './place-coach-tip';

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
  radius: string;
}

interface TipBox {
  top: number;
  left: number;
}

const PAD = 8;
const TIP_WIDTH = 320;
const TIP_HEIGHT = 220;

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
  readonly isFirst = input(false);
  readonly isLast = input(false);
  readonly next = output<void>();
  readonly prev = output<void>();

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
      this.tip.set({ top: 16, left: 12 });
      this.queueAlign(true);
    });
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
      if (this.tries < 12) this.queueAlign(scroll);
      return;
    }

    this.tries = 0;
    if (scroll) {
      this.cancelScroll?.();
      this.cancelScroll = animateScrollIntoView(el, this.measureTip().height + 36, () => this.place(el));
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
    const view = { width: window.innerWidth, height: window.innerHeight };
    this.tip.set(placeCoachTip(hole, view, this.measureTip()));
    requestAnimationFrame(() => {
      if (!this.open()) return;
      this.tip.set(placeCoachTip(hole, view, this.measureTip()));
    });
  }

  private measureTip(): { width: number; height: number } {
    const node = document.querySelector('.coach__tip');
    if (node instanceof HTMLElement && node.getClientRects().length) {
      const rect = node.getBoundingClientRect();
      return {
        width: Math.max(160, Math.ceil(rect.width)),
        height: Math.max(120, Math.ceil(rect.height)),
      };
    }
    return { width: TIP_WIDTH, height: TIP_HEIGHT };
  }

  private readRadius(el: HTMLElement): string {
    const nodes = [el, el.firstElementChild].filter((node): node is HTMLElement => node instanceof HTMLElement);
    for (const node of nodes) {
      const value = getComputedStyle(node).borderRadius;
      if (value && value !== '0px' && !value.split(' ').every((part) => part === '0px')) {
        return this.offsetRadius(value);
      }
    }
    return `${14 + PAD}px`;
  }

  private offsetRadius(value: string): string {
    return value
      .split(' ')
      .map((part) => {
        const amount = Number.parseFloat(part);
        if (!Number.isFinite(amount) || amount <= 0) return part;
        if (amount >= 999) return part;
        const unit = part.replace(/[0-9.]/g, '') || 'px';
        return `${amount + PAD}${unit}`;
      })
      .join(' ');
  }
}
