import { configuration, rangeMidpointUnits, unitsToMm } from '../documentation/configuration';

/**
 * Геометрия поршня в его собственной системе координат.
 *
 * Локальная ось цилиндра всегда +Y. Внешняя группа поршня поворачивает эту ось
 * в ось нужного банка; тело, канавки и кольца не знают о мировых X/Y/Z.
 *
 * Диаметры цилиндра и поршня выводятся из подтверждённых диапазонов Toyota RM630E
 * (`configuration.verified`) и не дублируются числами. Высота поршня, осевые
 * положения канавок и сечения колец в доступной документации не заданы, поэтому
 * они остаются явно помеченной пропорциональной реконструкцией.
 */
const V = configuration.verified;

/** Средний подтверждённый диаметр поршня STD Mark 1 → радиус в единицах сцены. */
const pistonRadius = rangeMidpointUnits(V.pistonDiameterMark1Mm) / 2;
/** Средний подтверждённый диаметр цилиндра STD Mark 1 → радиус в единицах сцены. */
const cylinderBoreRadius = rangeMidpointUnits(V.cylinderBoreMark1Mm) / 2;

export const PISTON_GEOMETRY = {
  /** Пропорциональная реконструкция: высота поршня не подтверждена документацией. */
  height: 0.62,
  radius: pistonRadius,
  grooveRootRadius: 0.447,
  cylinderBoreRadius,
  /** Реконструкция: осевые положения канавок и сечения колец. */
  rings: [
    { kind: 'compression-1', centerY: 0.22, grooveWidth: 0.022, tubeRadius: 0.008 },
    { kind: 'compression-2', centerY: 0.165, grooveWidth: 0.024, tubeRadius: 0.009 },
    { kind: 'oil-control', centerY: 0.095, grooveWidth: 0.038, tubeRadius: 0.0045 },
  ],
  source: {
    bore: 'toyota-service-data',
    pistonDiameter: 'toyota-service-data',
    pistonAndRingGeometry: 'proportional-reconstruction',
  },
} as const;

export const PISTON_LOCAL_AXIS = [0, 1, 0] as const;

/** Подтверждённый диаметральный зазор поршень–цилиндр, выведенный из геометрии модели. */
export const derivedPistonClearanceMm = unitsToMm(PISTON_GEOMETRY.cylinderBoreRadius - PISTON_GEOMETRY.radius) * 2;

/** localOffset хранится от нижней плоскости поршня; это удобно для каталога деталей. */
export function ringOffsetFromBottom(index: number): number {
  const ring = PISTON_GEOMETRY.rings[index];
  if (!ring) throw new RangeError(`Unknown piston ring index: ${index}`);
  return ring.centerY + PISTON_GEOMETRY.height / 2;
}
