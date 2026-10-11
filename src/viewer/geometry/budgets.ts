import type { PartKind } from '../../core/types';
import type { GeometryTier } from './lod';

/** Биты конструктивных фич, включаемых на конкретных тирах. Каждая фича — реальная геометрия. */
export const FEAT = {
  CHAMFER: 1 << 0,
  FILLET: 1 << 1,
  GROOVE: 1 << 2,
  THREAD: 1 << 3,
  TEETH: 1 << 4,
  OILHOLE: 1 << 5,
  RIB: 1 << 6,
  SPLINE: 1 << 7,
  SEAT: 1 << 8,
  BOSS: 1 << 9,
} as const;

export type FeatureFlag = keyof typeof FEAT;

/** Фактический полигональный профиль деталей вида: суммарные треугольники по всем
 * деталям этого kind на тире 0..8 (измерено валидатором в tests/geometry.test.ts).
 * Цифры — допусковая база: профиль не должен отклоняться от них более чем на ±50%
 * (иначе валидатор ломает сильную связь «тир ↔ количество геометрии»). */
export interface LodProfile {
  /** Треугольники суммарно по деталям вида на конкретном тире. */
  tris: number[];
  /** Маска фичей на каждый тир. */
  feat: number[];
}

function profile(tris: number[], feat: number[]): LodProfile {
  return { tris, feat };
}

/** Бюджет для тиров, которых нет в явной таблице. */
export const BUDGETS: Record<PartKind, LodProfile> = {
  block: profile([184, 876, 1712, 3696, 6336, 10600, 18812, 36640, 77584],
    [0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.FILLET, FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS, FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS | FEAT.RIB, FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS | FEAT.RIB | FEAT.OILHOLE,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS | FEAT.RIB | FEAT.OILHOLE, FEAT.CHAMFER | FEAT.FILLET | FEAT.BOSS | FEAT.RIB | FEAT.OILHOLE]),
  head: profile([112, 216, 352, 2784, 9088, 14992, 24440, 51648, 106272],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.SEAT, FEAT.CHAMFER | FEAT.SEAT | FEAT.BOSS,
      FEAT.CHAMFER | FEAT.SEAT | FEAT.BOSS | FEAT.RIB, FEAT.CHAMFER | FEAT.SEAT | FEAT.BOSS | FEAT.RIB,
      FEAT.CHAMFER | FEAT.SEAT | FEAT.BOSS | FEAT.RIB | FEAT.GROOVE, FEAT.CHAMFER | FEAT.SEAT | FEAT.BOSS | FEAT.RIB | FEAT.GROOVE]),
  crank: profile([864, 1664, 3840, 6976, 12224, 24092, 34236, 59060, 112364],
    [0, 0, FEAT.FILLET, FEAT.FILLET, FEAT.FILLET | FEAT.OILHOLE, FEAT.FILLET | FEAT.OILHOLE | FEAT.SPLINE,
      FEAT.FILLET | FEAT.OILHOLE | FEAT.SPLINE | FEAT.CHAMFER, FEAT.FILLET | FEAT.OILHOLE | FEAT.SPLINE | FEAT.CHAMFER | FEAT.GROOVE,
      FEAT.FILLET | FEAT.OILHOLE | FEAT.SPLINE | FEAT.CHAMFER | FEAT.GROOVE]),
  piston: profile([29696, 32768, 47872, 76160, 95744, 126080, 191744, 292864, 611840],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.GROOVE, FEAT.CHAMFER | FEAT.GROOVE, FEAT.CHAMFER | FEAT.GROOVE | FEAT.FILLET,
      FEAT.CHAMFER | FEAT.GROOVE | FEAT.FILLET | FEAT.OILHOLE, FEAT.CHAMFER | FEAT.GROOVE | FEAT.FILLET | FEAT.OILHOLE,
      FEAT.CHAMFER | FEAT.GROOVE | FEAT.FILLET | FEAT.OILHOLE | FEAT.RIB]),
  pin: profile([256, 384, 768, 1152, 2048, 3200, 5376, 11264, 26112], []),
  rod: profile([2432, 4800, 8448, 15744, 32256, 51840, 75008, 128512, 232448],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.FILLET, FEAT.CHAMFER | FEAT.FILLET,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB, FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB, FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB | FEAT.OILHOLE]),
  bearing: profile([400, 720, 1280, 2400, 3840, 6400, 9600, 16640, 30720], []),
  cam: profile([6144, 8256, 12544, 23232, 32640, 62896, 157040, 235088, 380592],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.FILLET, FEAT.CHAMFER | FEAT.FILLET,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.SPLINE, FEAT.CHAMFER | FEAT.FILLET | FEAT.SPLINE | FEAT.GROOVE,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.SPLINE | FEAT.GROOVE, FEAT.CHAMFER | FEAT.FILLET | FEAT.SPLINE | FEAT.GROOVE]),
  valve: profile([2048, 3072, 6144, 24576, 90112, 148480, 227328, 409600, 798720],
    [0, 0, 0, FEAT.SEAT, FEAT.SEAT | FEAT.GROOVE, FEAT.SEAT | FEAT.GROOVE | FEAT.CHAMFER,
      FEAT.SEAT | FEAT.GROOVE | FEAT.CHAMFER, FEAT.SEAT | FEAT.GROOVE | FEAT.CHAMFER, FEAT.SEAT | FEAT.GROOVE | FEAT.CHAMFER]),
  spring: profile([4096, 7424, 16640, 40704, 96256, 201600, 391680, 728448, 1186816], []),
  bucket: profile([1024, 1536, 3072, 4608, 8192, 12800, 21504, 45056, 104448], []),
  pulley: profile([416, 672, 1280, 4512, 7424, 12288, 35732, 53276, 89636],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.GROOVE, FEAT.CHAMFER | FEAT.GROOVE | FEAT.BOSS,
      FEAT.CHAMFER | FEAT.GROOVE | FEAT.BOSS | FEAT.RIB, FEAT.CHAMFER | FEAT.GROOVE | FEAT.BOSS | FEAT.RIB | FEAT.TEETH,
      FEAT.CHAMFER | FEAT.GROOVE | FEAT.BOSS | FEAT.RIB | FEAT.TEETH, FEAT.CHAMFER | FEAT.GROOVE | FEAT.BOSS | FEAT.RIB | FEAT.TEETH]),
  belt: profile([336, 528, 976, 2016, 3968, 7280, 12480, 21248, 33024], []),
  timingCover: profile([40, 56, 72, 160, 208, 344, 440, 672, 1000], []),
  pan: profile([32, 48, 224, 384, 736, 1136, 6908, 14014, 31558],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.RIB, FEAT.CHAMFER | FEAT.RIB,
      FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS, FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS, FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS]),
  pickup: profile([176, 360, 640, 1152, 1856, 2720, 3840, 6656, 12672], []),
  pump: profile([128, 192, 384, 576, 1024, 1600, 2688, 5632, 13056], []),
  filter: profile([224, 336, 640, 1056, 4096, 6720, 10440, 19016, 37704],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.GROOVE, FEAT.CHAMFER | FEAT.GROOVE,
      FEAT.CHAMFER | FEAT.GROOVE | FEAT.RIB, FEAT.CHAMFER | FEAT.GROOVE | FEAT.RIB, FEAT.CHAMFER | FEAT.GROOVE | FEAT.RIB]),
  rail: profile([64, 96, 192, 288, 512, 800, 1344, 2816, 6528], []),
  injector: profile([704, 1248, 2176, 4608, 7680, 12480, 20960, 38912, 74112], []),
  plug: profile([448, 640, 1296, 1968, 3456, 5440, 9184, 19184, 44336], []),
  coil: profile([704, 1248, 2176, 4608, 7680, 12480, 20960, 38912, 74112], []),
  sensor: profile([528, 936, 1632, 3456, 5760, 9360, 15720, 29184, 55584], []),
  alternator: profile([64, 96, 192, 288, 512, 800, 1344, 2816, 6528], []),
  starter: profile([64, 96, 192, 288, 512, 800, 1344, 2816, 6528], []),
  gasket: profile([112, 216, 352, 720, 1216, 1840, 3240, 5568, 9568], []),
  bolt: profile([1120, 1600, 3240, 4920, 8640, 13600, 22960, 47960, 110840], []),
  pipe: profile([16, 24, 64, 96, 192, 320, 576, 1280, 3072], []),
  gear: profile([448, 768, 1408, 16880, 20880, 27504, 35440, 62672, 102448],
    [0, 0, 0, FEAT.TEETH, FEAT.TEETH | FEAT.CHAMFER, FEAT.TEETH | FEAT.CHAMFER | FEAT.BOSS,
      FEAT.TEETH | FEAT.CHAMFER | FEAT.BOSS, FEAT.TEETH | FEAT.CHAMFER | FEAT.BOSS | FEAT.GROOVE,
      FEAT.TEETH | FEAT.CHAMFER | FEAT.BOSS | FEAT.GROOVE]),
  exhaust: profile([704, 1248, 2496, 4608, 12544, 20128, 31040, 53376, 101888],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.FILLET, FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB,
      FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB, FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB, FEAT.CHAMFER | FEAT.FILLET | FEAT.RIB]),
  plenum: profile([112, 216, 352, 856, 2400, 3744, 6320, 12032, 24000],
    [0, 0, FEAT.CHAMFER, FEAT.CHAMFER | FEAT.RIB, FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS,
      FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS, FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS,
      FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS | FEAT.GROOVE, FEAT.CHAMFER | FEAT.RIB | FEAT.BOSS | FEAT.GROOVE]),
  runner: profile([640, 1152, 2048, 3840, 6144, 10240, 15360, 26624, 49152], []),
  throttle: profile([64, 96, 192, 288, 512, 800, 1344, 2816, 6528], []),
  cover: profile([168, 324, 528, 1296, 2112, 3480, 5844, 10368, 18000], []),
  mainCap: profile([100, 140, 180, 400, 520, 860, 1100, 1680, 2500], []),
  rodCap: profile([640, 1152, 2048, 3840, 6144, 10240, 15360, 26624, 49152], []),
  ring: profile([0, 0, 0, 0, 0, 0, 0, 0, 0], []),
  retainer: profile([1024, 1536, 3072, 4608, 8192, 12800, 21504, 45056, 104448], []),
  shim: profile([1024, 1536, 3072, 4608, 8192, 12800, 21504, 45056, 104448], []),
  guide: profile([512, 768, 2048, 3072, 6144, 10240, 18432, 40960, 98304], []),
  seat: profile([2560, 4608, 8192, 15360, 24576, 40960, 61440, 106496, 196608], []),
  hydraulicTensioner: profile([64, 96, 192, 288, 512, 800, 1344, 2816, 6528], []),
};

/** Бюджет для тиров, которых нет в явной таблице. */
export function budgetFor(kind: PartKind): LodProfile {
  return BUDGETS[kind] ?? compact(300, 3000);
}

function compact(t0: number, t8: number): LodProfile {
  const t: number[] = [];
  for (let i = 0; i < 9; i++) t.push(Math.round(t0 * Math.pow(t8 / t0, i / 8)));
  return profile(t, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

export function featureMask(kind: PartKind, tier: GeometryTier): number {
  return budgetFor(kind).feat[tier] ?? 0;
}

export function hasFeature(kind: PartKind, tier: GeometryTier, flag: keyof typeof FEAT): boolean {
  return (featureMask(kind, tier) & FEAT[flag]) !== 0;
}
