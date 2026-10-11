import * as THREE from 'three';

export interface HelixParams {
  radius: number;
  height: number;
  turns: number;
  tubeRadius: number;
  steps: number;
  radial: number;
}

/** Винтовая пружина вокруг оси Y. */
export function springTube(p: HelixParams): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const totalPoints = Math.max(8, Math.round(p.steps));
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const a = t * Math.PI * 2 * p.turns;
    points.push(new THREE.Vector3(p.radius * Math.cos(a), t * p.height - p.height / 2, p.radius * Math.sin(a)));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, totalPoints, p.tubeRadius, Math.max(3, p.radial), false);
}

/** Плоский контур зубчатого венца (для экструзии) с прямоугольными зубьями. */
export function gearShape(outerRadius: number, teeth: number, toothDepth: number, innerRadius?: number): THREE.Shape {
  const shape = new THREE.Shape();
  const root = outerRadius - toothDepth;
  const step = (Math.PI * 2) / teeth;
  const arcPerTooth = step * 0.45;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    shape.absarc(0, 0, root, a0, a0 + step - arcPerTooth, false);
    shape.absarc(0, 0, outerRadius, a0 + step - arcPerTooth, a0 + step, false);
  }
  if (innerRadius && innerRadius > 0) {
    shape.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  }
  return shape;
}

/** Мелкие радиальные сегменты отмечаются в кэш-ключах номером тира. */
export function segKey(prefix: string, tier: number, tag = ''): string {
  return `${prefix}:t${tier}${tag ? `:${tag}` : ''}`;
}