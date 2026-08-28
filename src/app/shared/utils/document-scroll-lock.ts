import { Injectable } from '@angular/core';

const GAP_VAR = '--scroll-lock-gap';

@Injectable({ providedIn: 'root' })
export class DocumentScrollLock {
  private locks = 0;
  private scrollY = 0;
  private previous: {
    htmlOverflow: string;
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
    bodyPaddingRight: string;
    htmlPaddingRight: string;
  } | null = null;

  lock(): void {
    this.locks += 1;
    if (this.locks > 1) return;

    const html = document.documentElement;
    const body = document.body;
    this.scrollY = window.scrollY;
    const gap = Math.max(0, window.innerWidth - html.clientWidth);

    this.previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlPaddingRight: html.style.paddingRight,
    };

    html.style.setProperty(GAP_VAR, `${gap}px`);
    html.style.overflow = 'hidden';
    html.style.paddingRight = gap ? `${gap}px` : this.previous.htmlPaddingRight;
    html.classList.add('is-scroll-locked');

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (gap) {
      body.style.paddingRight = `${gap}px`;
    }
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
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.paddingRight = previous.bodyPaddingRight;
    }

    window.scrollTo(0, this.scrollY);
  }

  reset(): void {
    if (this.locks === 0) return;
    this.locks = 1;
    this.unlock();
  }
}
