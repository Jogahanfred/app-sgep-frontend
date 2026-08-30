export function easeInOutCubic(progress: number): number {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }
  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animateScrollY(from: number, to: number, onDone?: () => void): () => void {
  if (Math.abs(to - from) < 2) {
    onDone?.();
    return () => undefined;
  }

  if (prefersReducedMotion()) {
    window.scrollTo(0, to);
    onDone?.();
    return () => undefined;
  }

  const duration = Math.min(900, Math.max(280, Math.abs(to - from) * 0.55));
  let frame = 0;
  const began = performance.now();

  const tick = (now: number) => {
    const elapsed = now - began;
    const progress = Math.min(1, elapsed / duration);
    window.scrollTo(0, from + (to - from) * easeInOutCubic(progress));
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    onDone?.();
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export function animateScrollToTop(onDone?: () => void): () => void {
  return animateScrollY(window.scrollY, 0, onDone);
}

export function animateScrollIntoView(el: HTMLElement, pad = 96, onDone?: () => void): () => void {
  const rect = el.getBoundingClientRect();
  const topGap = rect.top - pad;
  const bottomGap = rect.bottom - (window.innerHeight - pad);
  let delta = 0;
  if (topGap < 0) delta = topGap;
  else if (bottomGap > 0) delta = bottomGap;
  return animateScrollY(window.scrollY, window.scrollY + delta, onDone);
}
