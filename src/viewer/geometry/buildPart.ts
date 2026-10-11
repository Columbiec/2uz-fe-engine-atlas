import { Group } from 'three';
import type { EnginePart } from '../../core/types';
import { lodSegments, tierForDetail, type GeometryTier } from './lod';
import { KIND_BUILDERS, type PartBuild } from './builders';
import { capsuleMesh, groupStats } from './builders/util';
import { geometryCache } from './cache';

export interface BuiltGeometry {
  group: Group;
  keys: string[];
  tier: GeometryTier;
}

function fallbackBuilder(part: EnginePart, tier: GeometryTier): PartBuild {
  const keys: string[] = [];
  const group = new Group();
  group.add(capsuleMesh(keys, part.kind, tier, lodSegments(tier), 0.18, 0.8));
  return { group, keys };
}

/** Собирает геометрию детали на заданном тире. Геометрия центрирована в локальном
 * origin: та же деталь на разных тирах не смещается (тир влияет только на сегментацию и
 * конструктивные фичи). Метрики кладутся в userData для HUD. */
export function buildPartGeometry(part: EnginePart, tier: GeometryTier): BuiltGeometry {
  const seg = lodSegments(tier);
  const builder = KIND_BUILDERS[part.kind] ?? fallbackBuilder;
  const built = builder(part, { tier, seg });
  const stats = groupStats(built.keys);
  built.group.userData.geometryStats = stats;
  built.group.userData.geometryTier = tier;
  return { group: built.group, keys: built.keys, tier };
}

export function releaseBuiltGeometry(built: BuiltGeometry): void {
  geometryCache.releaseMany(built.keys);
}

export { tierForDetail };
export type { GeometryTier };