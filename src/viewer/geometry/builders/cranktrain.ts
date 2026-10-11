import { Group } from 'three';
import type { EnginePart } from '../../../core/types';
import { mechanics, mainJournalZ, cylinderPairZ, throwOffsets } from '../../../data/engine/kinematics';
import { PISTON_GEOMETRY } from '../../../data/engine/pistonGeometry';
import type { LodSegments } from '../lod';
import type { GeometryTier } from '../lod';
import { cylMesh, torusMesh, sphereMesh, capsuleMesh, boxMesh } from './util';
import { hasFeature } from '../budgets';
import { gearRing, oilHole, filletCollar, ribPlate } from './features';

export interface BuildCtx {
  tier: GeometryTier;
  seg: LodSegments;
}

export function pistonBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const radialScale = Math.max(1, 64 / ctx.seg.radial);
  const halfHeight = PISTON_GEOMETRY.height / 2;
  // Канавки и кольца читаются прямо из PISTON_GEOMETRY: раньше позиция шла через
  // localOffset каталога и возвращалась обратно, из-за чего билдер зависел от того,
  // в каком порядке additionalParts создал детали-кольца.
  const grooves = [...PISTON_GEOMETRY.rings].sort((a, b) => a.centerY - b.centerY);

  // Тело действительно прерывается в канавках: корень канавки имеет меньший
  // радиус, а кольца располагаются внутри этого объёма. Все координаты локальные.
  let cursor = -halfHeight;
  grooves.forEach((groove, i) => {
    const lower = groove.centerY - groove.grooveWidth / 2;
    const landHeight = lower - cursor;
    if (landHeight > 0) {
      group.add(cylMesh(keys, 'piston', ctx.tier, ctx.seg, PISTON_GEOMETRY.radius, PISTON_GEOMETRY.radius - 0.004, landHeight, [0, cursor + landHeight / 2, 0], undefined, radialScale, false, `land${i}`));
    }
    const root = cylMesh(keys, 'piston', ctx.tier, ctx.seg, PISTON_GEOMETRY.grooveRootRadius, PISTON_GEOMETRY.grooveRootRadius, groove.grooveWidth, [0, groove.centerY, 0], undefined, radialScale, false, `grooveRoot${i}`);
    root.userData.pistonGroove = true;
    group.add(root);
    cursor = groove.centerY + groove.grooveWidth / 2;
  });
  const crownHeight = halfHeight - cursor;
  group.add(cylMesh(keys, 'piston', ctx.tier, ctx.seg, PISTON_GEOMETRY.radius, PISTON_GEOMETRY.radius, crownHeight, [0, cursor + crownHeight / 2, 0], undefined, radialScale, false, 'crown'));

  if (hasFeature('piston', ctx.tier, 'CHAMFER')) {
    group.add(sphereMesh(keys, 'piston', ctx.tier, ctx.seg, PISTON_GEOMETRY.radius * 1.03, [0, halfHeight - 0.04, 0], [1, 0.2, 1], 'dome'));
  }
  if (hasFeature('piston', ctx.tier, 'OILHOLE')) {
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      oilHole(keys, 'piston', ctx.tier, ctx.seg, 0.012, 0.5, [Math.sin(a) * 0.36, 0.14, Math.cos(a) * 0.36] as const, [Math.PI / 2, a, 0], `oil${k}`);
    }
  }
  if (hasFeature('piston', ctx.tier, 'RIB')) {
    ribPlate(keys, 'piston', ctx.tier, ctx.seg, 0.08, 0.26, 0.02, [0.3, -0.2, 0], undefined, 'sk1');
    ribPlate(keys, 'piston', ctx.tier, ctx.seg, 0.08, 0.26, 0.02, [-0.3, -0.2, 0], undefined, 'sk2');
  }

  PISTON_GEOMETRY.rings.forEach((ring, i) => {
    const y = ring.centerY;
    const addRing = (centerY: number, tube: number, radiusInset = 0, tag = '') => {
      const mesh = torusMesh(
        keys, 'piston', ctx.tier, ctx.seg,
        PISTON_GEOMETRY.cylinderBoreRadius - tube - radiusInset, tube,
        [0, centerY, 0], [-Math.PI / 2, 0, 0], Math.PI * 1.98, 1,
        `ring${i}${tag}`, radialScale,
      );
      mesh.userData.pistonRing = true;
      mesh.userData.ringIndex = i;
      group.add(mesh);
    };
    if (ring.kind === 'oil-control' && ctx.tier >= 3) {
      addRing(y - 0.012, ring.tubeRadius, 0, 'lowerRail');
      addRing(y, 0.003, 0.006, 'expander');
      addRing(y + 0.012, ring.tubeRadius, 0, 'upperRail');
    } else {
      addRing(y, ring.tubeRadius, 0, 'single');
    }
  });

  return { group, keys };
}

export function crankBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'crank', ctx.tier, ctx.seg, 0.15, 0.15, 4.9, undefined, [Math.PI / 2, 0, 0], 1, false, 'main'));
  for (const z of mainJournalZ) {
    group.add(cylMesh(keys, 'crank', ctx.tier, ctx.seg, 0.24, 0.24, 0.2, [0, 0, z], [Math.PI / 2, 0, 0], 1, false, 'journal'));
  }
  if (hasFeature('crank', ctx.tier, 'FILLET')) {
    for (const z of mainJournalZ) {
      filletCollar(keys, 'crank', ctx.tier, ctx.seg, 0.24, 0.03, Math.PI * 1.6, [0, 0, z], undefined, `fil${z}`);
    }
  }
  if (hasFeature('crank', ctx.tier, 'OILHOLE')) {
    for (const z of mainJournalZ) {
      oilHole(keys, 'crank', ctx.tier, ctx.seg, 0.045, 0.55, [0, 0, z], [0, 0, Math.PI / 2], `oil${z}`);
    }
  }
  if (hasFeature('crank', ctx.tier, 'SPLINE')) {
    gearRing(keys, 'crank', ctx.tier, ctx.seg, 0.13, 0.02, 0.28, [0, 0, 2.32], undefined, 'nose');
  }
  throwOffsets.forEach((a, i) => {
    const throwGroup = new Group();
    throwGroup.position.set(0, 0, cylinderPairZ(i));
    throwGroup.rotation.z = -a;
    throwGroup.add(cylMesh(keys, 'crank', ctx.tier, ctx.seg, 0.16, 0.16, 0.46, [0, mechanics.crankRadius, 0], [Math.PI / 2, 0, 0], 1, false, 'thr'));
    for (const z of [-0.28, 0.28]) {
      const web = new Group();
      web.position.set(0, 0, z);
      web.add(boxMesh(keys, 'crank', ctx.tier, ctx.seg, 0.3, 0.7, 0.12, [0, 0.17, 0], undefined, undefined, undefined, 1, `web${z > 0 ? 'p' : 'm'}`));
      web.add(sphereMesh(keys, 'crank', ctx.tier, ctx.seg, 0.37, [0, -0.28, 0], [1, 0.7, 0.25], 'cw'));
      throwGroup.add(web);
    }
    group.add(throwGroup);
  });
  return { group, keys };
}

export function pinBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'pin', ctx.tier, ctx.seg, 0.08, 0.08, 0.65, undefined, [Math.PI / 2, 0, 0], 1, false, 'pin'));
  void part;
  return { group, keys };
}

export function rodBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(capsuleMesh(keys, 'rod', ctx.tier, ctx.seg, 0.08, mechanics.rodLength - 0.2, undefined, undefined, 'shank'));
  group.add(torusMesh(keys, 'rod', ctx.tier, ctx.seg, 0.13, 0.05, [0, mechanics.rodLength / 2, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'small'));
  group.add(torusMesh(keys, 'rod', ctx.tier, ctx.seg, 0.2, 0.07, [0, -mechanics.rodLength / 2, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 1, 'big'));
  if (hasFeature('rod', ctx.tier, 'FILLET')) {
    filletCollar(keys, 'rod', ctx.tier, ctx.seg, 0.13, 0.025, Math.PI * 2, [0, mechanics.rodLength / 2, 0], [Math.PI / 2, 0, 0], 'smallFil');
    filletCollar(keys, 'rod', ctx.tier, ctx.seg, 0.2, 0.03, Math.PI * 2, [0, -mechanics.rodLength / 2, 0], [Math.PI / 2, 0, 0], 'bigFil');
  }
  if (hasFeature('rod', ctx.tier, 'RIB')) {
    ribPlate(keys, 'rod', ctx.tier, ctx.seg, 0.05, mechanics.rodLength * 0.5, 0.06, [0, 0, -0.1], undefined, 'l1');
    ribPlate(keys, 'rod', ctx.tier, ctx.seg, 0.05, mechanics.rodLength * 0.5, 0.06, [0, 0, 0.1], undefined, 'l2');
  }
  void part;
  return { group, keys };
}

export function mainCapBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(boxMesh(keys, 'mainCap', ctx.tier, ctx.seg, 0.8, 0.25, 0.2, undefined, undefined, undefined, undefined, 1, 'cap'));
  return { group, keys };
}

export function rodCapBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(torusMesh(keys, 'rodCap', ctx.tier, ctx.seg, 0.2, 0.06, undefined, [Math.PI / 2, 0, 0], Math.PI, 1, 'cap'));
  return { group, keys };
}

export function bearingBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(torusMesh(keys, 'bearing', ctx.tier, ctx.seg, 0.2, 0.055, undefined, [Math.PI / 2, 0, 0], Math.PI * 1.7, 1, 'brg'));
  return { group, keys };
}

export function ringBuilder(_part: EnginePart, _ctx: BuildCtx): { group: Group; keys: string[] } {
  // Кольца рендерятся в составе поршня (pistonBuilder), чтобы оставаться соосными его канавкам.
  const keys: string[] = [];
  void _part; void _ctx;
  return { group: new Group(), keys };
}
