import {
  Mesh,
  BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, CapsuleGeometry, BufferGeometry,
} from 'three';
import { geometryCache } from '../cache';
import { segKey } from '../primitives';
import type { GeometryTier, LodSegments } from '../lod';

/** Собирает ключ кэша для конкретной геометрии на конкретном тире. */
export function key(tier: GeometryTier, kind: string, tag: string | number = ''): string {
  return segKey(kind, tier, String(tag));
}

/** Добавляет геометрию в кэш (если нет — создаёт через make) и возвращает. */
export function geo(
  keys: string[],
  k: string,
  make: () => BufferGeometry,
): BufferGeometry {
  keys.push(k);
  return geometryCache.acquire(k, make).geo;
}

/** Возвращает mesh с shared-геометрией, опционально positioned/rotated. */
export function mesh(
  keys: string[],
  k: string,
  make: () => BufferGeometry,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
): Mesh {
  const m = new Mesh(geo(keys, k, make));
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
}

export function groupStats(keys: string[]): { tris: number; verts: number; bytes: number } {
  return geometryCache.sum(keys);
}

/** Параметризованный цилиндр (радиальные сегменты растут с тиром). */
export function cylGeometry(
  seg: LodSegments,
  rTop: number,
  rBottom: number,
  height: number,
  radialScale = 1,
  openEnded = false,
): BufferGeometry {
  const n = Math.max(3, Math.round(seg.radial * radialScale));
  return new CylinderGeometry(rTop, rBottom, height, n, Math.max(1, Math.min(seg.axial, 16)), openEnded);
}

export function cylMesh(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  rTop: number,
  rBottom: number,
  height: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  radialScale = 1,
  openEnded = false,
  tag = '',
): Mesh {
  return mesh(keys, key(tier, kind, `cyl${tag}`), () => cylGeometry(seg, rTop, rBottom, height, radialScale, openEnded), pos, rot);
}

/** Параметризованный тор: radialSegments — вокруг основного кольца,
 *  tubeSegments — вдоль сечения трубки.
 *  circleScale >= 1 поднимает число основных сегментов кольца (для крупных деталей). */
export function torusGeometry(seg: LodSegments, radius: number, tube: number, arc = Math.PI * 2, tubeScale = 1, circleScale = 1): BufferGeometry {
  return new TorusGeometry(radius, tube, Math.max(3, Math.round(seg.radialHi * tubeScale)), Math.max(6, Math.round(seg.radial * circleScale)), arc);
}

export function torusMesh(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  tube: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  arc = Math.PI * 2,
  tubeScale = 1,
  tag = '',
  circleScale = 1,
): Mesh {
  return mesh(keys, key(tier, kind, `tor${tag}`), () => torusGeometry(seg, radius, tube, arc, tubeScale, circleScale), pos, rot);
}

export function sphereGeometry(seg: LodSegments, radius: number): BufferGeometry {
  return new SphereGeometry(radius, Math.max(4, seg.radial), Math.max(3, seg.cap), 0, Math.PI * 2, 0, Math.PI);
}

export function sphereMesh(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  pos?: readonly [number, number, number],
  scale?: readonly [number, number, number],
  tag = '',
): Mesh {
  const m = mesh(keys, key(tier, kind, `sph${tag}`), () => sphereGeometry(seg, radius), pos);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  return m;
}

export function capsuleGeometry(seg: LodSegments, radius: number, length: number, radialScale = 1): BufferGeometry {
  return new CapsuleGeometry(radius, length, Math.max(3, seg.cap), Math.max(3, Math.round(seg.radial * radialScale)));
}

export function capsuleMesh(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  radius: number,
  length: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  tag = '',
): Mesh {
  return mesh(keys, key(tier, kind, `cap${tag}`), () => capsuleGeometry(seg, radius, length), pos, rot);
}

export function boxMesh(
  keys: string[],
  kind: string,
  tier: GeometryTier,
  seg: LodSegments,
  w: number,
  h: number,
  d: number,
  pos?: readonly [number, number, number],
  rot?: readonly [number, number, number],
  segX: number = seg.boxX,
  segY: number = seg.boxY,
  segZ: number = seg.boxZ,
  tag = '',
): Mesh {
  const n = (v: number) => Math.max(1, Math.round(v));
  return mesh(keys, key(tier, kind, `box${tag}`), () => new BoxGeometry(w, h, d, n(segX), n(segY), n(segZ)), pos, rot);
}