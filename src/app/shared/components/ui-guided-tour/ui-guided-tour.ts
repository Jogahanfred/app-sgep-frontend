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
  readonly placed = signal(false);

  constructor() {
    const onResize = () => {
      if (this.placed()) this.queueAlign(false);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      cancelAnimationFrame(this.raf);
    });

    effect(() => {
      const open = this.open();
      const step = this.step();
      if (!open || !step?.target) {
        this.hole.set(null);
        this.tip.set(null);
        this.placed.set(false);
        this.tries = 0;
        return;
      }
      this.tries = 0;
      this.placed.set(false);
      this.hole.set(null);
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
    if (scroll) this.jumpTo(el);
    this.place(el);
  }

  private jumpTo(el: HTMLElement): void {
    const pad = TIP_HEIGHT + 36;
    const rect = el.getBoundingClientRect();
    const topGap = rect.top - pad;
    const bottomGap = rect.bottom - (window.innerHeight - pad);
    let delta = 0;
    if (topGap < 0) delta = topGap;
    else if (bottomGap > 0) delta = bottomGap;
    if (delta) window.scrollTo({ top: window.scrollY + delta, behavior: 'auto' });
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
      if (!this.open() || !this.step()?.target) return;
      this.tip.set(placeCoachTip(hole, view, this.measureTip()));
      this.placed.set(true);
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
