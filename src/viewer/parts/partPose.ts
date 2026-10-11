import * as THREE from 'three';
import type { EnginePart } from '../../core/types';
import { shaftAngle, slider, valveLift } from '../../data/engine/kinematics';
import { timingWheels } from '../../data/engine/timing';

/** Поза детали в мировых координатах на текущий угол коленвала. */
export interface PartPose {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

export interface PartPoseContext {
  /** Угол коленвала в градусах. */
  theta: number;
  /** 0..100 из ползунка «разнести». */
  explode: number;
  /** Деталь снята текущим шагом разборки. */
  removed: boolean;
}

const SLIDER_KINDS = new Set(['piston', 'pin', 'rod', 'rodCap']);
const VALVE_KINDS = new Set(['valve', 'bucket', 'retainer', 'shim', 'spring']);
const ONE = [1, 1, 1] as const;

/** Зависит ли поза детали от угла коленвала.
 *  Позволяет не пересчитывать матрицы инстансов статичных деталей (блок, головки,
 *  крышки, датчики, крепёж) на каждом кадре работы двигателя. */
export function isPartAnimated(part: EnginePart): boolean {
  if (part.cylinder && (SLIDER_KINDS.has(part.kind) || VALVE_KINDS.has(part.kind))) return true;
  if (part.kind === 'crank' || part.kind === 'cam' || part.kind === 'gear') return true;
  if (part.id === 'crank-pulley') return true;
  return timingWheels.some((wheel) => wheel.id === part.id);
}

export function createPartPose(): PartPose {
  return { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, 1, 1) };
}

/** Единственное место, где считается кинематика детали.
 *  Вынесено из React-компонента, чтобы одинаково применять позу и к одиночному
 *  мешу, и к инстансу в батче — иначе логика неизбежно разъедется. */
export function applyPartPose(part: EnginePart, context: PartPoseContext, pose: PartPose): PartPose {
  const { position, rotation, scale } = pose;
  const { theta } = context;
  const factor = Math.max(context.explode / 100, context.removed ? 1 : 0);

  position.set(part.position[0], part.position[1], part.position[2]);
  rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
  const baseScale = part.scale ?? ONE;
  scale.set(baseScale[0], baseScale[1], baseScale[2]);

  if (part.cylinder && SLIDER_KINDS.has(part.kind)) {
    const slide = slider(theta, part.cylinder);
    if (part.kind === 'rod') {
      // Середина между шатунной шейкой и пальцем — без промежуточных аллокаций.
      position.set(
        (slide.journal[0] + slide.pin[0]) / 2,
        (slide.journal[1] + slide.pin[1]) / 2,
        (slide.journal[2] + slide.pin[2]) / 2,
      );
      rotation.set(0, 0, slide.rodAngle);
    } else if (part.kind === 'rodCap') {
      // Крышка сидит на шатунной шейке, а не в середине шатуна.
      position.set(slide.journal[0], slide.journal[1], slide.journal[2]);
      rotation.set(0, 0, slide.rodAngle);
    } else {
      position.set(slide.pin[0], slide.pin[1], slide.pin[2]);
    }
  }
  if (part.kind === 'crank' || part.id === 'crank-pulley') rotation.set(0, 0, shaftAngle(theta, 'crank'));
  if (part.kind === 'cam' || part.kind === 'gear') rotation.set(0, 0, shaftAngle(theta, part.id.includes('exhaust') ? 'exhaust' : 'intake'));

  const wheel = timingWheels.find((entry) => entry.id === part.id);
  if (wheel) rotation.set(0, 0, -theta * Math.PI / 180 * .25 / wheel.r);

  if (part.cylinder && VALVE_KINDS.has(part.kind)) {
    const fullLift = valveLift(theta, part.cylinder, part.valveType === 'intake');
    const lift = part.kind === 'spring' ? fullLift / 2 : fullLift;
    if (part.kind === 'spring') scale.y = 1 - fullLift / .22;
    // Смещение вдоль оси клапана берётся из базового угла детали, а не из текущего:
    // у распредвалов и шестерён поворот уже переписан выше.
    position.x += Math.sin(part.rotation[2]) * lift;
    position.y -= Math.cos(part.rotation[2]) * lift;
  }

  position.x += part.explodedVector[0] * factor;
  position.y += part.explodedVector[1] * factor;
  position.z += part.explodedVector[2] * factor;
  return pose;
}
