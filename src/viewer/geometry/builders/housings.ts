import { Group } from 'three';
import type { EnginePart } from '../../../core/types';
import { bankPoint, cylinderZ, pistonRotationZ } from '../../../data/engine/kinematics';
import { PISTON_GEOMETRY } from '../../../data/engine/pistonGeometry';
import { boxMesh, cylMesh, capsuleMesh, torusMesh } from './util';
import { hasFeature } from '../budgets';
import { ribPlate, bossCyl, oilHole } from './features';
import type { BuildCtx } from './cranktrain';

export function blockBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.add(boxMesh(keys, 'block', ctx.tier, seg, 2.55, 1.55, 4.75, undefined, undefined, undefined, undefined, undefined, 'crankcase'));
  for (let n = 1; n <= 8; n++) {
    const side = n % 2 ? 1 : -1;
    group.add(cylMesh(
      keys, 'block', ctx.tier, seg, PISTON_GEOMETRY.cylinderBoreRadius, PISTON_GEOMETRY.cylinderBoreRadius, 1.79,
      bankPoint(side, 1.445, cylinderZ(n)), [0, 0, pistonRotationZ(n)], 1, true, `bore${n}`,
    ));
    if (hasFeature('block', ctx.tier, 'CHAMFER')) {
      const [bx, , bz] = bankPoint(side, 1.445, cylinderZ(n));
      group.add(torusMesh(keys, 'block', ctx.tier, seg, 0.475, 0.02, [bx, 0.7, bz], [Math.PI / 2, 0, 0], Math.PI * 2, 0.5, `deck${n}`));
    }
  }
  if (hasFeature('block', ctx.tier, 'BOSS')) {
    for (const [x, z] of [[1.62, 1.6], [-1.62, 1.6], [1.62, -1.6], [-1.62, -1.6]] as const) {
      group.add(bossCyl(keys, 'block', ctx.tier, seg, 0.28, 0.16, [x, -0.2, z], [0, 0, Math.PI / 2], `mt${x}${z}`));
    }
  }
  if (hasFeature('block', ctx.tier, 'RIB')) {
    for (const z of [2.11, 1.055, 0, -1.055, -2.11]) {
      ribPlate(keys, 'block', ctx.tier, seg, 0.35, 0.55, 0.12, [0, -0.85, z], undefined, `web${z}`);
    }
  }
  if (hasFeature('block', ctx.tier, 'OILHOLE')) {
    for (const z of [1.6, 0, -1.6]) {
      oilHole(keys, 'block', ctx.tier, seg, 0.16, 1.55, [0, -0.3, z], [0, 0, Math.PI / 2], `gal${z}`);
    }
  }
  return { group, keys };
}

export function headBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  const side = part.bank === 1 ? 1 : -1;
  group.add(boxMesh(keys, 'head', ctx.tier, seg, 1.45, 0.62, 4.72, undefined, undefined, undefined, undefined, undefined, 'body'));
  for (let n = 1; n <= 8; n++) {
    if ((n % 2 === 1) !== (part.bank === 1)) continue;
    const [bx, , bz] = bankPoint(side, 1.445, cylinderZ(n));
    if (hasFeature('head', ctx.tier, 'SEAT')) {
      group.add(torusMesh(keys, 'head', ctx.tier, seg, 0.475, 0.018, [bx, -0.29, bz], [Math.PI / 2, 0, 0], Math.PI * 2, 0.45, `seat${n}`));
    }
  }
  if (hasFeature('head', ctx.tier, 'BOSS')) {
    for (const z of [-1.86, -0.94, 0, 0.94, 1.86]) {
      for (const x of [-0.42, 0.42]) {
        group.add(bossCyl(keys, 'head', ctx.tier, seg, 0.16, 0.22, [x, 0.32, z], undefined, `cap${z}${x}`));
      }
    }
  }
  if (hasFeature('head', ctx.tier, 'RIB')) {
    for (const z of [-1.2, 0, 1.2]) {
      ribPlate(keys, 'head', ctx.tier, seg, 0.4, 0.28, 0.06, [side * 0.62, 0.1, z], undefined, `rib${z}`);
    }
  }
  if (hasFeature('head', ctx.tier, 'GROOVE')) {
    group.add(torusMesh(keys, 'head', ctx.tier, seg, 0.42, 0.01, [0, 0.28, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 0.6, 'oil'));
  }
  void part;
  return { group, keys };
}

export function coverBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.add(boxMesh(keys, 'cover', ctx.tier, seg, 1.15, 0.42, 4.3, undefined, undefined, undefined, undefined, undefined, 'body'));
  return { group, keys };
}

export function gasketBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(boxMesh(keys, 'gasket', ctx.tier, ctx.seg, 1.38, 0.035, 4.62, undefined, undefined, undefined, 1, undefined, 'gsk'));
  return { group, keys };
}

export function panBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.add(cylMesh(keys, 'pan', ctx.tier, seg, 1.13, 0.82, 0.75, undefined, undefined, 1, false, 'pan'));
  if (hasFeature('pan', ctx.tier, 'CHAMFER')) {
    group.add(torusMesh(keys, 'pan', ctx.tier, seg, 1.13, 0.025, [0, 0.36, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 0.5, 'rim'));
  }
  if (hasFeature('pan', ctx.tier, 'RIB')) {
    for (const z of [-1.2, 0, 1.2]) {
      ribPlate(keys, 'pan', ctx.tier, seg, 0.3, 0.32, 0.06, [0, -0.45, z], undefined, `rib${z}`);
    }
  }
  if (hasFeature('pan', ctx.tier, 'BOSS')) {
    group.add(bossCyl(keys, 'pan', ctx.tier, seg, 0.12, 0.16, [0, -0.48, 0], undefined, 'drain'));
    group.add(cylMesh(keys, 'pan', ctx.tier, seg, 0.16, 0.16, 0.06, [0, -0.5, 0.45], undefined, 0.7, false, 'nut'));
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      group.add(bossCyl(keys, 'pan', ctx.tier, seg, 0.08, 0.05, [Math.cos(a) * 1.05, 0.36, Math.sin(a) * 1.05], undefined, `tab${k}`));
    }
  }
  return { group, keys };
}

export function pickupBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(capsuleMesh(keys, 'pickup', ctx.tier, ctx.seg, 0.055, 0.65, [0, 0.2, 0], undefined, 'tube'));
  group.add(cylMesh(keys, 'pickup', ctx.tier, ctx.seg, 0.3, 0.22, 0.12, [0, -0.23, 0], undefined, 1, false, 'strainer'));
  return { group, keys };
}
