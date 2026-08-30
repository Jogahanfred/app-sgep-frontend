export interface CoachBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGIN = 12;
const GAP = 12;

function overlaps(a: CoachBox, b: CoachBox, pad = 4): boolean {
  return !(
    a.left + a.width <= b.left - pad ||
    b.left + b.width <= a.left - pad ||
    a.top + a.height <= b.top - pad ||
    b.top + b.height <= a.top - pad
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), Math.max(min, max));
}

export function placeCoachTip(
  hole: CoachBox,
  view: { width: number; height: number },
  tip: { width: number; height: number },
): { top: number; left: number } {
  const width = Math.min(tip.width, Math.max(80, view.width - MARGIN * 2));
  const height = tip.height;
  const clampLeft = (left: number) => clamp(left, MARGIN, view.width - width - MARGIN);
  const clampTop = (top: number) => clamp(top, MARGIN, view.height - height - MARGIN);

  const candidates: { top: number; left: number }[] = [
    { top: hole.top - GAP - height, left: clampLeft(hole.left) },
    { top: hole.top + hole.height + GAP, left: clampLeft(hole.left) },
    { top: clampTop(hole.top), left: hole.left + hole.width + GAP },
    { top: clampTop(hole.top), left: hole.left - GAP - width },
  ];

  for (const point of candidates) {
    const box: CoachBox = { top: point.top, left: point.left, width, height };
    const inView =
      box.top >= MARGIN - 1 &&
      box.left >= MARGIN - 1 &&
      box.top + box.height <= view.height - MARGIN + 1 &&
      box.left + box.width <= view.width - MARGIN + 1;
    if (inView && !overlaps(box, hole)) return point;
  }

  return { top: hole.top + hole.height + GAP, left: clampLeft(hole.left) };
}
