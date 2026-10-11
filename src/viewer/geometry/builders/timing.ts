import { Group, Curve, Vector3, TubeGeometry } from 'three';
import type { EnginePart } from '../../../core/types';
import { beltLength, beltPoint } from '../../../data/engine/timing';
import { cylMesh, torusMesh, boxMesh, mesh, key } from './util';
import { hasFeature } from '../budgets';
import { gearRing, grooveRing, bossCyl, ribPlate } from './features';
import type { BuildCtx } from './cranktrain';

export class BeltCurve extends Curve<Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, target = new Vector3()): Vector3 {
    const [x, y] = beltPoint(t * beltLength);
    return target.set(x, y, 0);
  }
}

export function pulleyBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.rotation.x = Math.PI / 2;
  const seg = ctx.seg;
  const id = part.id;

  if (id === 'crank-pulley') {
    // Демпферный шкив: обод с двумя канавками, рёбра и передняя ступица.
    group.add(cylMesh(keys, 'pulley', ctx.tier, seg, 0.42, 0.42, 0.2, undefined, undefined, 1, false, 'rim'));
    if (hasFeature('pulley', ctx.tier, 'GROOVE')) {
      grooveRing(keys, 'pulley', ctx.tier, seg, 0.38, 0.02, [0, 0.055, 0], undefined, Math.PI * 2, 'g1');
      grooveRing(keys, 'pulley', ctx.tier, seg, 0.38, 0.02, [0, -0.055, 0], undefined, Math.PI * 2, 'g2');
    }
    if (hasFeature('pulley', ctx.tier, 'RIB')) {
      for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        ribPlate(keys, 'pulley', ctx.tier, seg, 0.06, 0.32, 0.1, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.07], [0, 0, -a], `rib${a}`);
      }
    }
    group.add(bossCyl(keys, 'pulley', ctx.tier, seg, 0.22, 0.34, [0, 0, -0.1], undefined, 'hub'));
  } else if (id === 'crank-sprocket') {
    // Зубчатый шкив коленвала: ступица + зубчатый венец.
    group.add(cylMesh(keys, 'pulley', ctx.tier, seg, 0.18, 0.18, 0.2, undefined, undefined, 1, false, 'hub'));
    if (hasFeature('pulley', ctx.tier, 'TEETH')) {
      gearRing(keys, 'pulley', ctx.tier, seg, 0.26, 0.045, 0.12);
    }
  } else if (id.startsWith('cam-pulley')) {
    // Ведомый шкив ремня ГРМ (впускной): ступица + мелкозубчатый пояс.
    group.add(cylMesh(keys, 'pulley', ctx.tier, seg, 0.27, 0.27, 0.18, undefined, undefined, 1, false, 'hub'));
    if (hasFeature('pulley', ctx.tier, 'TEETH')) {
      gearRing(keys, 'pulley', ctx.tier, seg, 0.28, 0.02, 0.12);
    }
  } else if (id === 'water-pump-pulley') {
    // Многоручейковый шкив водяного насоса: три клиновые канавки.
    group.add(cylMesh(keys, 'pulley', ctx.tier, seg, 0.24, 0.24, 0.14, undefined, undefined, 1, false, 'hub'));
    if (hasFeature('pulley', ctx.tier, 'GROOVE')) {
      for (const r of [0.225, 0.195, 0.165]) {
        grooveRing(keys, 'pulley', ctx.tier, seg, r, 0.016, undefined, undefined, Math.PI * 2, `v${r}`);
      }
    }
  } else {
    // Натяжной и обводной ролики: гладкий обод с канавкой.
    group.add(cylMesh(keys, 'pulley', ctx.tier, seg, 0.18, 0.18, 0.16, undefined, undefined, 1, false, 'rim'));
    group.add(torusMesh(keys, 'pulley', ctx.tier, seg, 0.15, 0.03, [0, 0.08, 0], undefined, Math.PI * 2, 1, 'groove'));
  }
  return { group, keys };
}

export function beltBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  if (part.id === 'timing-belt') {
    group.add(mesh(keys, key(ctx.tier, 'belt', 'timing'), () =>
      new TubeGeometry(new BeltCurve(), Math.max(16, ctx.seg.tubeSteps * 2), 0.027, Math.max(4, ctx.seg.tubeRadial), true),
    ));
  } else {
    group.add(torusMesh(keys, 'belt', ctx.tier, ctx.seg, 1.35, 0.045, undefined, undefined, Math.PI * 2, 1, 'acc'));
  }
  return { group, keys };
}

export function timingCoverBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(boxMesh(keys, 'timingCover', ctx.tier, ctx.seg, 1.2, 1.8, 0.14, undefined, undefined, undefined, undefined, 1, 'cover'));
  if (hasFeature('timingCover', ctx.tier, 'RIB')) {
    ribPlate(keys, 'timingCover', ctx.tier, ctx.seg, 1.0, 0.07, 0.12, [0, -0.4, 0.07], undefined, 'low');
    ribPlate(keys, 'timingCover', ctx.tier, ctx.seg, 0.07, 1.0, 0.12, [0.45, 0.2, 0.07], undefined, 'vert');
  }
  if (hasFeature('timingCover', ctx.tier, 'BOSS')) {
    for (const [x, y] of [[-0.42, -0.7], [0.42, -0.7], [-0.42, 0.7], [0.42, 0.7]] as const) {
      bossCyl(keys, 'timingCover', ctx.tier, ctx.seg, 0.12, 0.1, [x, y, 0.08], undefined, `b${x}${y}`);
    }
  }
  return { group, keys };
}

export function gearBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.rotation.x = Math.PI / 2;
  group.add(cylMesh(keys, 'gear', ctx.tier, seg, 0.33, 0.33, 0.1, undefined, undefined, 1, false, 'blank'));
  if (hasFeature('gear', ctx.tier, 'TEETH')) {
    gearRing(keys, 'gear', ctx.tier, seg, 0.34, 0.05, 0.12);
  }
  group.add(torusMesh(keys, 'gear', ctx.tier, seg, 0.33, 0.025, undefined, undefined, Math.PI * 2, 1, 'ring'));
  if (hasFeature('gear', ctx.tier, 'BOSS')) {
    bossCyl(keys, 'gear', ctx.tier, seg, 0.12, 0.22, [0, 0, -0.06], undefined, 'hub');
  }
  if (hasFeature('gear', ctx.tier, 'GROOVE')) {
    grooveRing(keys, 'gear', ctx.tier, seg, 0.3, 0.008, [0, 0.045, 0], undefined, Math.PI * 2, 'gg');
  }
  void _part;
  return { group, keys };
}