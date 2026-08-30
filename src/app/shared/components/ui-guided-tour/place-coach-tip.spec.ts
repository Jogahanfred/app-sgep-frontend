import { placeCoachTip } from './place-coach-tip';

function box(top: number, left: number, width: number, height: number) {
  return { top, left, width, height };
}

function overlaps(
  a: { top: number; left: number; width: number; height: number },
  b: { top: number; left: number; width: number; height: number },
): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

describe('placeCoachTip', () => {
  const view = { width: 1280, height: 800 };
  const tip = { width: 320, height: 220 };

  it('lo coloca arriba cuando cabe, sin tapar el recuadro', () => {
    const hole = box(280, 80, 640, 220);
    const point = placeCoachTip(hole, view, tip);
    expect(point.top + tip.height).toBeLessThanOrEqual(hole.top);
    expect(overlaps({ ...point, ...tip }, hole)).toBe(false);
  });

  it('si no cabe arriba, lo baja debajo y no se monta encima de la matriz', () => {
    const hole = box(40, 80, 720, 260);
    const point = placeCoachTip(hole, view, tip);
    expect(point.top).toBeGreaterThanOrEqual(hole.top + hole.height);
    expect(overlaps({ ...point, ...tip }, hole)).toBe(false);
  });

  it('si no cabe arriba ni abajo, lo pone al lado', () => {
    const hole = box(80, 40, 700, 680);
    const point = placeCoachTip(hole, view, tip);
    expect(overlaps({ ...point, ...tip }, hole)).toBe(false);
    expect(point.left).toBeGreaterThanOrEqual(hole.left + hole.width);
  });
});
