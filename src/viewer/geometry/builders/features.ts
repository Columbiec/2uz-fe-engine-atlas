import { ExtrudeGeometry } from 'three';
import type { GeometryTier, LodSegments } from '../lod';
import { gearShape } from '../primitives';
import { mesh, key, cylMesh, torusMesh, boxMesh } from './util';

/** Число зубьев венца: растёт с тиром, независимо от таблиц сегментации. */
export function gearTeeth(tier: GeometryTier): number {
  return 8 + Math.round(tier * 3.25);
}

/** Зубчатый венец (экструдированный контур с прямоугольными зубьями).
 *  Ключ кэша включает тир, поэтому венец пересобирается при смене числа зубьев. */
export function gearRing(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  _seg: LodSegments,
  outerRadius: number,
  toothDepth: number,
  len: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
) {
  return mesh(
    keys,
    key(tier, kind, `teeth${tag}`),
    () => new ExtrudeGeometry(gearShape(outerRadius, gearTeeth(tier), toothDepth), { depth: len, bevelEnabled: false }),
    pos,
    rot,
  );
}

/** Сквозное отверстие: тонкий цилиндр без крышек (канал масла, дренаж, галтель). */
export function oilHole(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  length: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
) {
  return cylMesh(keys, kind, tier, seg, radius, radius, length, pos, rot, 1, true, `hole${tag}`);
}

/** Кольцевая канавка на теле вращения (масляная, смазочная, разгрузочная). */
export function grooveRing(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  tube: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  arc = Math.PI * 2,
  tag = '',
) {
  return torusMesh(keys, kind, tier, seg, radius, tube, pos, rot, arc, 1, `groove${tag}`);
}

/** Упругое ребро/ламина корпуса: тонкая пластина-усилитель. */
export function ribPlate(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  w: number,
  h: number,
  d: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
) {
  return boxMesh(keys, kind, tier, seg, w, h, d, pos, rot, 2, 1, 2, `rib${tag}`);
}

/** Бобышка фланца/ступицы: короткий открытый цилиндр-выступ. */
export function bossCyl(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  height: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
) {
  return cylMesh(keys, kind, tier, seg, radius, radius, height, pos, rot, 1, false, `boss${tag}`);
}

/** Галтельная кромка сопряжения шейки/тела: тор малого радиуса. */
export function filletCollar(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  tube: number,
  arc: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
) {
  return torusMesh(keys, kind, tier, seg, radius, tube, pos, rot, arc, 0.6, `filet${tag}`);
}