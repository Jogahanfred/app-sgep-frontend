import { Injectable } from '@angular/core';

const GAP_VAR = '--scroll-lock-gap';

@Injectable({ providedIn: 'root' })
export class DocumentScrollLock {
  private locks = 0;
  private previous: {
    htmlOverflow: string;
    bodyOverflow: string;
    htmlPaddingRight: string;
    bodyPaddingRight: string;
  } | null = null;

  lock(): void {
    this.locks += 1;
    if (this.locks > 1) return;

    const html = document.documentElement;
    const body = document.body;
    const gap = Math.max(0, window.innerWidth - html.clientWidth);

    this.previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlPaddingRight: html.style.paddingRight,
      bodyPaddingRight: body.style.paddingRight,
    };

    html.style.setProperty(GAP_VAR, `${gap}px`);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (gap) {
      html.style.paddingRight = `${gap}px`;
      body.style.paddingRight = `${gap}px`;
    }
    html.classList.add('is-scroll-locked');
  }

  unlock(): void {
    if (this.locks === 0) return;
    this.locks -= 1;
    if (this.locks > 0) return;

    const html = document.documentElement;
    const body = document.body;
    const previous = this.previous;
    this.previous = null;

    html.classList.remove('is-scroll-locked');
    html.style.removeProperty(GAP_VAR);

    if (previous) {
      html.style.overflow = previous.htmlOverflow;
      html.style.paddingRight = previous.htmlPaddingRight;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
    }
  }

  reset(): void {
    if (this.locks === 0) return;
    this.locks = 1;
    this.unlock();
  }
}
