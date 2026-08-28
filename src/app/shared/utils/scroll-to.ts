export function easeInOutCubic(progress: number): number {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }
  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animateScrollToTop(onDone?: () => void): () => void {
  const start = window.scrollY;
  if (start <= 0) {
    onDone?.();
    return () => undefined;
  }

  if (prefersReducedMotion()) {
    window.scrollTo(0, 0);
    onDone?.();
    return () => undefined;
  }

  const duration = Math.min(1600, Math.max(700, start * 0.55));
  let frame = 0;
  const began = performance.now();

  const tick = (now: number) => {
    const elapsed = now - began;
    const progress = Math.min(1, elapsed / duration);
    window.scrollTo(0, start * (1 - easeInOutCubic(progress)));
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    onDone?.();
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
