/** Геометрические тиры LOD. Ползунок 10–500% раскрывает части (minimumDetailLevel),
 * а тир задаёт реальную полигональную сложность каждой mesh. */
export type GeometryTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const MAX_TIER: GeometryTier = 8;

/** Уровни ползунка, соответствующие тирам (та же шкала, что в detail.ts). */
export const TIER_LEVELS: readonly number[] = [10, 25, 50, 100, 150, 200, 300, 400, 500];

/** Маппинг процента детализации в ближайший геометрический тир. */
export function tierForDetail(level: number): GeometryTier {
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < TIER_LEVELS.length; i++) {
    const delta = Math.abs(level - TIER_LEVELS[i]!);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return best as GeometryTier;
}

export interface LodSegments {
  /** Радиальные сегменты основных округлений (цилиндры, торы, шкивы). */
  radial: number;
  /** Сегменты мелких округлений (трубки торов, бобышки, фаски). */
  radialHi: number;
  /** Осевые сегменты вытянутых тел и корпусов. */
  axial: number;
  /** Сегменты сферических шапок и капсул. */
  cap: number;
  /** Количество шагов вдоль спирали/траектории (пружины, ремни, кулачки). */
  tubeSteps: number;
  /** Радиальные сегменты трубки/ленты. */
  tubeRadial: number;
  /** Точки контурных кривых (кулачок, лопасти, зубья). */
  curve: number;
  /** Сегменты коробчатых тел по ширине (X). */
  boxX: number;
  /** Сегменты коробчатых тел по высоте (Y). */
  boxY: number;
  /** Сегменты коробчатых тел по длине (Z). */
  boxZ: number;
}

const TABLES: Record<keyof LodSegments, readonly number[]> = {
  radial: [8, 12, 16, 24, 32, 40, 48, 64, 96],
  radialHi: [5, 6, 8, 10, 12, 16, 20, 26, 32],
  axial: [1, 1, 2, 2, 3, 4, 6, 10, 16],
  cap: [4, 6, 8, 10, 12, 14, 16, 20, 24],
  tubeSteps: [16, 24, 36, 64, 100, 150, 220, 320, 420],
  tubeRadial: [4, 4, 5, 6, 8, 10, 12, 14, 16],
  curve: [48, 64, 96, 160, 220, 280, 360, 432, 512],
  boxX: [2, 3, 4, 6, 8, 10, 13, 16, 20],
  boxY: [1, 1, 1, 2, 2, 3, 3, 4, 5],
  boxZ: [4, 6, 8, 12, 16, 20, 28, 40, 56],
};

export function lodSegments(tier: GeometryTier): LodSegments {
  const segments = {} as LodSegments;
  (Object.keys(TABLES) as (keyof LodSegments)[]).forEach((key) => {
    segments[key] = TABLES[key][tier]!;
  });
  return segments;
}