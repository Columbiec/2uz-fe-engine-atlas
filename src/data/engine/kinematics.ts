import { configuration, mmToUnits } from '../documentation/configuration';

/**
 * Правая система координат: +Y вверх, +Z к передней стороне двигателя, +X к
 * нечётному ряду (цилиндры 1, 3, 5, 7). Положительный угол — вращение по часовой
 * стрелке при взгляде спереди, то есть отрицательный поворот вокруг +Z.
 *
 * Все расстояния выводятся из подтверждённых миллиметров в `configuration.verified`;
 * литералов «на глаз» здесь нет. Исключение помечено ниже как параметр реконструкции.
 */
const V = configuration.verified;

/** Подтверждённый порядок работы. */
export const firingOrder = V.firingOrder.value;

const cylinderCount = V.cylinderCount.value;
/** Угол между вспышками: полный цикл 720° делится на число цилиндров. */
export const firingIntervalDeg = 720 / cylinderCount;

export const mechanics = {
  /** Радиус кривошипа = половина хода поршня (подтверждён). */
  crankRadius: mmToUnits(V.strokeMm.value) / 2,
  /** Параметр реконструкции, НЕ подтверждённый заводской размер. */
  rodLength: mmToUnits(configuration.reconstruction.rodLengthMm),
  /** Номинальный диаметр цилиндров. */
  bore: mmToUnits(V.boreMm.value),
  /** Шаг цилиндров вдоль оси коленвала (подтверждён). */
  borePitch: mmToUnits(V.borePitchMm.value),
  /** Продольное смещение рядов (подтверждено). */
  bankOffset: mmToUnits(V.bankOffsetMm.value),
};

/** Половина угла развала: оси цилиндров наклонены на 45° от вертикали. Дробные
 *  значения совпадают с Math.PI/4 и Math.SQRT1_2 бит-в-бит (проверено тестом). */
export const halfBankAngleRad = (V.bankAngleDeg.value / 2) * Math.PI / 180;
const bankCos = Math.cos(halfBankAngleRad);
const bankSin = Math.sin(halfBankAngleRad);
/** Половина полного угла между осями впускного и выпускного клапанов (подтверждён). */
export const valveHalfAngleRad = V.includedValveAngleDeg.value * Math.PI / 360;

export const cycleAngle = (theta: number, cylinder: number) =>
  ((theta - firingOrder.indexOf(cylinder as typeof firingOrder[number]) * firingIntervalDeg) % 720 + 720) % 720;

/** Позиции пяти коренных опор вдоль оси коленвала: 2B, B, 0, −B, −2B. */
export const mainJournalZ: readonly number[] = [2, 1, 0, -1, -2].map((k) => k * mechanics.borePitch);

/** Продольная координата пары цилиндров: середина между двумя коренными опорами. */
export const cylinderPairZ = (pairIndex: number) =>
  mainJournalZ[0]! - mechanics.borePitch / 2 - pairIndex * mechanics.borePitch;

/** У каждого цилиндра своя координата вдоль коленвала: ряды смещены на половину
 *  подтверждённого продольного смещения в противоположные стороны. */
export const cylinderZ = (n: number) =>
  cylinderPairZ(Math.floor((n - 1) / 2)) + (n % 2 ? mechanics.bankOffset / 2 : -mechanics.bankOffset / 2);

export const throwOffsets = [Math.PI/4, 3*Math.PI/4, -Math.PI/4, -3*Math.PI/4];

export function cylinderAxis(cylinder: number): [number, number, number] {
  const side = cylinder % 2 ? 1 : -1;
  return [side * bankCos, bankSin, 0];
}

export function pistonRotationZ(cylinder: number): number {
  return -(cylinder % 2 ? 1 : -1) * halfBankAngleRad;
}

/** Точка в системе координат ряда: y — вдоль оси цилиндра, x — поперёк неё.
 *  Базис берётся из `cylinderAxis`, чтобы развал не дублировался литералами. */
export function bankPoint(side: number, y: number, z: number, x = 0): [number, number, number] {
  const [ux, uy] = cylinderAxis(side === 1 ? 1 : 2);
  return [ux * y + uy * x, uy * y - ux * x, z];
}

export function slider(theta: number, cylinder: number) {
  const a = throwOffsets[Math.floor((cylinder-1)/2)] + theta*Math.PI/180;
  const x = mechanics.crankRadius*Math.sin(a), y = mechanics.crankRadius*Math.cos(a);
  const [ux,uy] = cylinderAxis(cylinder);
  const dot = x*ux + y*uy;
  const distance = dot + Math.sqrt(mechanics.rodLength**2 - (x*x+y*y-dot*dot));
  const pin: [number,number,number] = [ux*distance,uy*distance,cylinderZ(cylinder)];
  const journal: [number,number,number] = [x,y,cylinderZ(cylinder)];
  return { pin, journal, rodAngle: Math.atan2(-(pin[0]-x),pin[1]-y), distance };
}

export function shaftAngle(theta: number, type: 'crank'|'intake'|'exhaust') {
  // Распредвалы вращаются в crankCamRatio раз медленнее коленвала, выпускной — встречно.
  const camRatio = V.crankCamRatio.value;
  return theta*Math.PI/180*(type==='crank' ? -1 : type==='intake' ? -1/camRatio : 1/camRatio);
}

/** Идеализированный подъём, а не измеренный профиль кулачка; theta=0 — ВМТ сжатия №1. */
export function valveLift(theta: number, cylinder: number, intake: boolean) {
  const cycle = cycleAngle(theta,cylinder), start = intake ? 360 : 180;
  return cycle>=start && cycle<=start+180 ? .08*Math.sin((cycle-start)*Math.PI/180)**2 : 0;
}

export class EngineAnimationController {
  angle = 0;
  advance(delta: number, rpm: number, speed: number) { this.angle += Math.min(delta,.1)*rpm*6*speed; return this.angle; }
}
