import { Group, Shape, ExtrudeGeometry } from 'three';
import type { EnginePart } from '../../../core/types';
import { cylinderZ, firingOrder, shaftAngle } from '../../../data/engine/kinematics';
import type { LodSegments } from '../lod';
import type { GeometryTier } from '../lod';
import { cylMesh, torusMesh, mesh, key } from './util';
import { springTube } from '../primitives';
import { hasFeature } from '../budgets';
import { gearRing, grooveRing, filletCollar } from './features';
import type { BuildCtx } from './cranktrain';

function lobeShape(points: number): Shape {
  const shape = new Shape();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const wrapped = Math.atan2(Math.sin(a), Math.cos(a));
    const lift = Math.abs(wrapped) < Math.PI / 4 ? 0.08 * Math.cos(2 * wrapped) ** 2 : 0;
    const r = 0.105 + lift;
    if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
    else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  return shape;
}

function camLobeGeometry(seg: LodSegments): ExtrudeGeometry {
  return new ExtrudeGeometry(lobeShape(seg.curve), { depth: 0.1, bevelEnabled: false });
}

function camLobeKey(tier: GeometryTier): string {
  return key(tier, 'cam', 'lobe');
}

export function camBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.add(cylMesh(keys, 'cam', ctx.tier, ctx.seg, 0.085, 0.085, 4.3, undefined, [Math.PI / 2, 0, 0], 1, false, 'shaft'));

  const side = part.bank === 1 ? 1 : -1;
  const type = part.valveType === 'intake' ? 'intake' : 'exhaust';
  const valveRotation = -side * Math.PI / 4 + (type === 'intake' ? side : -side) * 21.55 * Math.PI / 360;
  const contactAngle = Math.atan2(-Math.cos(valveRotation), Math.sin(valveRotation));

  for (let i = 0; i < 4; i++) {
    const n = 2 * i + (part.bank === 1 ? 1 : 2);
    const peak = firingOrder.indexOf(n as typeof firingOrder[number]) * 90 + (type === 'intake' ? 450 : 270);
    for (const offset of [-0.19, 0.19]) {
      const lobeMesh = mesh(keys, camLobeKey(ctx.tier), () => camLobeGeometry(seg), [0, 0, cylinderZ(n) + offset - 0.05], [0, 0, contactAngle - shaftAngle(peak, type)]);
      group.add(lobeMesh);
    }
  }
  if (hasFeature('cam', ctx.tier, 'SPLINE')) {
    gearRing(keys, 'cam', ctx.tier, ctx.seg, 0.085, 0.015, 0.22, [0, 0, -2.02], undefined, 'tail');
  }
  if (hasFeature('cam', ctx.tier, 'GROOVE')) {
    for (const z of [-2.4, -1.9, -1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.6, 2.1]) {
      grooveRing(keys, 'cam', ctx.tier, ctx.seg, 0.082, 0.006, [0, 0, z], undefined, Math.PI * 2, `g${z}`);
    }
  }
  if (hasFeature('cam', ctx.tier, 'FILLET')) {
    for (const z of [0.9, 1.9]) {
      filletCollar(keys, 'cam', ctx.tier, ctx.seg, 0.12, 0.02, Math.PI * 1.6, [0, 0, z], undefined, `f${z}`);
    }
  }
  return { group, keys };
}

export function valveBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'valve', ctx.tier, ctx.seg, 0.035, 0.035, 0.62, undefined, undefined, 1, false, 'stem'));
  group.add(cylMesh(keys, 'valve', ctx.tier, ctx.seg, 0.14, 0.09, 0.06, [0, -0.32, 0], undefined, 1, false, 'head'));
  if (hasFeature('valve', ctx.tier, 'GROOVE')) {
    grooveRing(keys, 'valve', ctx.tier, ctx.seg, 0.033, 0.005, [0, 0.25, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 'lock1');
    grooveRing(keys, 'valve', ctx.tier, ctx.seg, 0.033, 0.005, [0, 0.27, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 'lock2');
  }
  if (hasFeature('valve', ctx.tier, 'SEAT')) {
    torusMesh(keys, 'valve', ctx.tier, ctx.seg, 0.14, 0.012, [0, -0.335, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'face');
  }
  void _part;
  return { group, keys };
}

export function springBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const turns = 5 + Math.round(ctx.tier * 0.7);
  const steps = Math.round(ctx.seg.tubeSteps * (1 + ctx.tier * 0.22));
  const g = mesh(keys, key(ctx.tier, 'spring', 'helix'), () =>
    springTube({
      radius: 0.08,
      height: 0.22,
      turns,
      tubeRadius: 0.014,
      steps,
      radial: ctx.seg.tubeRadial,
    }),
  );
  void _part;
  group.add(g);
  return { group, keys };
}

export function bucketBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'bucket', ctx.tier, ctx.seg, 0.11, 0.11, 0.09, undefined, undefined, 1, false, 'bkt'));
  if (hasFeature('bucket', ctx.tier, 'CHAMFER')) {
    torusMesh(keys, 'bucket', ctx.tier, ctx.seg, 0.105, 0.007, [0, 0.045, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'rim');
  }
  void _part;
  return { group, keys };
}

export function retainerShimBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const h = part.kind === 'shim' ? 0.023 : 0.035;
  group.add(cylMesh(keys, part.kind, ctx.tier, ctx.seg, 0.105, 0.105, h, undefined, undefined, 1, false, 'disc'));
  if (hasFeature(part.kind, ctx.tier, 'CHAMFER')) {
    torusMesh(keys, part.kind, ctx.tier, ctx.seg, 0.098, 0.006, [0, h / 2 - 0.004, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'rim');
  }
  return { group, keys };
}

export function guideBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'guide', ctx.tier, ctx.seg, 0.055, 0.055, 0.22, undefined, undefined, 1, true, 'gd'));
  if (hasFeature('guide', ctx.tier, 'CHAMFER')) {
    grooveRing(keys, 'guide', ctx.tier, ctx.seg, 0.052, 0.005, [0, 0.09, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 'lip');
  }
  void _part;
  return { group, keys };
}

export function seatBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(torusMesh(keys, 'seat', ctx.tier, ctx.seg, 0.135, 0.018, undefined, [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'seat'));
  void _part;
  return { group, keys };
}