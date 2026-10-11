import { describe, expect, test } from 'vitest';
import { engine2uz } from '../src/engines/2uz-fe';
import { buildPartGeometry, releaseBuiltGeometry } from '../src/viewer/geometry/buildPart';
import { geometryCache } from '../src/viewer/geometry/cache';
import { lodSegments, tierForDetail, TIER_LEVELS, MAX_TIER } from '../src/viewer/geometry/lod';
import { budgetFor } from '../src/viewer/geometry/budgets';
import type { GeometryTier } from '../src/viewer/geometry/lod';
import { Mesh, Vector3 } from 'three';

const TIERS: GeometryTier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface Stats {
  tris: number;
  verts: number;
  bytes: number;
}

function buildTris(partId: string, tier: GeometryTier): number {
  const part = engine2uz.parts.find((p) => p.id === partId);
  if (!part) throw new Error(`part not found: ${partId}`);
  const built = buildPartGeometry(part, tier);
  const stats = built.group.userData.geometryStats as Stats;
  releaseBuiltGeometry(built);
  geometryCache.flush();
  return stats.tris;
}

describe('сегментационная матрица LOD', () => {
  test('кольца построены в local frame поршня и их normal совпадает с +Y', () => {
    for (let cylinder = 1; cylinder <= 8; cylinder++) {
      const part = engine2uz.parts.find((p) => p.id === `piston-${cylinder}`)!;
      const built = buildPartGeometry(part, 4);
      expect(built.group.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
      const rings: Mesh[] = [];
      built.group.traverse((object) => {
        if (object instanceof Mesh && object.userData.pistonRing) rings.push(object);
      });
      expect(rings).toHaveLength(5);
      for (const ring of rings) {
        const normal = new Vector3(0, 0, 1).applyQuaternion(ring.quaternion);
        expect(normal.dot(new Vector3(0, 1, 0))).toBeCloseTo(1, 10);
        expect(ring.position.x).toBe(0);
        expect(ring.position.z).toBe(0);
      }
      releaseBuiltGeometry(built);
      geometryCache.flush();
    }
  });
  test('lodSegments не убывают по каждому измерению и содержат ≥ 3 разных значений', () => {
    const keys = Object.keys(lodSegments(0)) as (keyof ReturnType<typeof lodSegments>)[];
    for (const key of keys) {
      const values = TIERS.map((t) => lodSegments(t)[key]);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]!, `${key} на тире ${i}`).toBeGreaterThanOrEqual(values[i - 1]!);
      }
      expect(new Set(values).size, `${key} должен иметь ≥ 3 уникальных значений`).toBeGreaterThanOrEqual(3);
    }
  });

  test('tierForDetail однозначно мапит ползунок в тир', () => {
    TIER_LEVELS.forEach((level, i) => expect(tierForDetail(level)).toBe(i));
    expect(tierForDetail(0)).toBe(0);
    expect(tierForDetail(999)).toBe(MAX_TIER);
  });

  test('монотонность трисов по тирам для каждой детали (392 шт)', () => {
    for (const part of engine2uz.parts) {
      let prev = 0;
      const seen = new Set<number>();
      for (const tier of TIERS) {
        const tris = buildTris(part.id, tier);
        expect(tris, `${part.kind} ${part.id} на тире ${tier}`).toBeGreaterThanOrEqual(prev);
        prev = tris;
        seen.add(tris);
      }
      // деталь не должна быть плоской: хотя бы 3 разных уровня триса на 9 тирах.
      // Исключение — поршневые кольца: они строятся внутри поршня (kind ['ring']).
      if (part.kind !== 'ring') {
        expect(seen.size, `${part.kind} ${part.id} не может быть плоской`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('профиль деталей держит бюджет (±50%) и сумма монотонна в 4–6M на 500%', () => {
    const byKind = new Map<string, number[]>();
    const totals: number[] = [];
    for (const tier of TIERS) {
      let total = 0;
      for (const part of engine2uz.parts) {
        const built = buildPartGeometry(part, tier);
        const tris = (built.group.userData.geometryStats as Stats).tris;
        total += tris;
        // Поршневые кольца — виртуальные: геометрия строится внутри поршня (kind ['ring']).
        if (part.kind !== 'ring') {
          const arr = byKind.get(part.kind) ?? new Array(TIERS.length).fill(0);
          if (!byKind.has(part.kind)) byKind.set(part.kind, arr);
          arr[tier] += tris;
        }
        releaseBuiltGeometry(built);
      }
      totals.push(total);
      geometryCache.flush();
    }
    for (const [kind, arr] of byKind) {
      const target = budgetFor(kind as Parameters<typeof budgetFor>[0]).tris;
      arr.forEach((actual, i) => {
        const t = target[i]!;
        expect(actual, `${kind} на тире ${i}: факт ${actual}, бюджет ${t}`).toBeGreaterThan(t * 0.5);
        expect(actual, `${kind} на тире ${i}: факт ${actual}, бюджет ${t}`).toBeLessThan(t * 1.5);
      });
    }
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]!).toBeGreaterThan(totals[i - 1]!);
    }
    // Целевой бюджет 500% — 4–6M трисов (набирается конструктивными фичами).
    expect(totals[8]!).toBeGreaterThan(4_000_000);
    expect(totals[8]!).toBeLessThan(6_000_000);
  }, 300_000);
});
