/** Факты и параметры реконструкции намеренно разделены.
 *
 * ВАЖНО: это единственный источник подтверждённых чисел. Кинематика
 * (`src/data/engine/kinematics.ts`) и геометрия поршня (`pistonGeometry.ts`) выводят
 * свои величины из `verified` ниже, а не повторяют их литералами. Если число
 * подтверждено документом — оно живёт здесь и только здесь.
 */
export const configuration = {
 id:'tundra-us-2003-2uz-fe-non-vvti', vehicle:'Toyota Tundra', year:2003, market:'US', vvti:false,
 primaryManual:'Toyota RM956U',
 verified:{
  boreMm:{value:94,source:'toyota-specs'},strokeMm:{value:84,source:'toyota-specs'},
  cylinderBoreMark1Mm:{min:94.002,max:94.010,source:'toyota-service-data',section:'SS-5'},
  pistonDiameterMark1Mm:{min:93.902,max:93.912,source:'toyota-service-data',section:'SS-5'},
  pistonOilClearanceMm:{min:0.090,max:0.111,source:'toyota-service-data',section:'SS-5'},
  ringGrooveClearanceMm:{compression1:[0.030,0.080],compression2:[0.030,0.070],source:'toyota-service-data',section:'SS-5'},
  bankAngleDeg:{value:90,source:'toyota-proper'},borePitchMm:{value:105.5,source:'toyota-proper'},
  bankOffsetMm:{value:21,source:'toyota-proper'},includedValveAngleDeg:{value:21.55,source:'toyota-proper'},
  headBoltCountPerBank:{value:10,source:'rm956u',section:'EM-57'},
  crankCamRatio:{value:2,source:'toyota-timing'},
  firingOrder:{value:[1,8,4,3,6,5,7,2],source:'toyota-proper'},
  cylinderCount:{value:8,source:'toyota-proper'},
 },
 reconstruction:{
  rodLengthMm:146,unitsMm:100,confidence:'approximate',pulleyCenters:'approximate',valveLiftProfile:'idealized',
  pistonAndRingGeometry:'piston/bore diameters are verified; groove axial positions, piston height and ring sections are proportional reconstructions',
 },
} as const;

/** Кинематическая единица модели в миллиметрах. 1 единица = 100 мм. */
export const MM_PER_UNIT: number = configuration.reconstruction.unitsMm;

/** Перевод миллиметров из документации в единицы сцены. */
export const mmToUnits = (mm: number): number => mm / MM_PER_UNIT;

/** Обратный перевод: единицы сцены в миллиметры (для сверки с документацией). */
export const unitsToMm = (units: number): number => units * MM_PER_UNIT;

/** Среднее подтверждённого диапазона (min..max) в единицах сцены. */
export const rangeMidpointUnits = (range: { min: number; max: number }): number =>
  mmToUnits((range.min + range.max) / 2);
