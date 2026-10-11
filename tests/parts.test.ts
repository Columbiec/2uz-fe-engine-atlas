import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { engine2uz } from '../src/engines/2uz-fe';
import { mechanics, shaftAngle, slider, valveLift } from '../src/data/engine/kinematics';
import { timingWheels } from '../src/data/engine/timing';
import { applyPartPose, createPartPose, isPartAnimated, type PartPose } from '../src/viewer/parts/partPose';
import { tierForDetail } from '../src/viewer/geometry/lod';
import type { EnginePart } from '../src/core/types';

/**
 * Референс — прежняя логика из EnginePartMesh.useFrame, скопированная один в один.
 * Поза была вынесена из компонента в applyPartPose, и этот тест фиксирует, что
 * вынос не изменил ни порядок операций, ни то, какие поля перезаписываются.
 */
function referencePose(part: EnginePart, theta: number, explode: number, removed: boolean) {
  const factor = Math.max(explode / 100, removed ? 1 : 0);
  const target = new THREE.Vector3(...part.position);
  const rotation = new THREE.Euler(...part.rotation);
  const scale = new THREE.Vector3(...(part.scale ?? [1, 1, 1]));
  if (part.cylinder && ['piston', 'pin', 'rod', 'rodCap'].includes(part.kind)) {
    const pose = slider(theta, part.cylinder);
    if (part.kind === 'rod' || part.kind === 'rodCap') {
      target.set(...pose.journal);
      if (part.kind === 'rod') target.add(new THREE.Vector3(...pose.pin)).multiplyScalar(.5);
      rotation.set(0, 0, pose.rodAngle);
    } else {
      target.set(...pose.pin);
    }
  }
  if (part.kind === 'crank' || part.id === 'crank-pulley') rotation.set(0, 0, shaftAngle(theta, 'crank'));
  if (part.kind === 'cam' || part.kind === 'gear') rotation.set(0, 0, shaftAngle(theta, part.id.includes('exhaust') ? 'exhaust' : 'intake'));
  const wheel = timingWheels.find((w) => w.id === part.id);
  if (wheel) rotation.set(0, 0, -theta * Math.PI / 180 * .25 / wheel.r);
  if (['valve', 'bucket', 'retainer', 'shim', 'spring'].includes(part.kind) && part.cylinder) {
    const fullLift = valveLift(theta, part.cylinder, part.valveType === 'intake');
    const lift = part.kind === 'spring' ? fullLift / 2 : fullLift;
    if (part.kind === 'spring') scale.y = 1 - fullLift / .22;
    target.x += Math.sin(part.rotation[2]) * lift;
    target.y -= Math.cos(part.rotation[2]) * lift;
  }
  target.x += part.explodedVector[0] * factor;
  target.y += part.explodedVector[1] * factor;
  target.z += part.explodedVector[2] * factor;
  return { position: target, rotation, scale };
}

function expectPoseMatches(actual: PartPose, expected: ReturnType<typeof referencePose>, label: string) {
  expect(actual.position.toArray(), `${label} position`).toEqual([expected.position.x, expected.position.y, expected.position.z]);
  expect(actual.rotation.toArray().slice(0, 3), `${label} rotation`).toEqual([expected.rotation.x, expected.rotation.y, expected.rotation.z]);
  expect(actual.scale.toArray(), `${label} scale`).toEqual([expected.scale.x, expected.scale.y, expected.scale.z]);
}

describe('поза детали совпадает с прежней реализацией', () => {
  test('все детали каталога на нескольких углах, с разнесением и разборкой', () => {
    const pose = createPartPose();
    const angles = [0, 37, 90, 180, 271, 360, 540, 719];
    const cases = [
      { explode: 0, removed: false },
      { explode: 100, removed: false },
      { explode: 35, removed: true },
    ];
    for (const part of engine2uz.parts) {
      for (const theta of angles) {
        for (const state of cases) {
          const label = `${part.id} θ=${theta} explode=${state.explode} removed=${state.removed}`;
          expectPoseMatches(applyPartPose(part, { theta, ...state }, pose), referencePose(part, theta, state.explode, state.removed), label);
        }
      }
    }
  });

  test('поза переиспользует один объект и не накапливает состояние', () => {
    const pose = createPartPose();
    const part = engine2uz.parts.find((p) => p.kind === 'spring')!;
    applyPartPose(part, { theta: 90, explode: 100, removed: true }, pose);
    const mutated = pose.position.clone();
    const untouched = engine2uz.parts.find((p) => p.kind === 'block')!;
    applyPartPose(untouched, { theta: 0, explode: 0, removed: false }, pose);
    expect(pose.position.toArray()).toEqual([...untouched.position]);
    expect(mutated.toArray()).not.toEqual(pose.position.toArray());
  });

  test('детали, помеченные статичными, действительно не зависят от угла', () => {
    // Флаг animated управляет тем, какие инстансы пересчитываются каждый кадр.
    // Ошибка в нём означала бы замершие поршни или лишнюю работу на кадр.
    const poseA = createPartPose();
    const poseB = createPartPose();
    const animated: string[] = [];
    for (const part of engine2uz.parts) {
      if (isPartAnimated(part)) { animated.push(part.id); continue; }
      for (const theta of [0, 137, 480]) {
        applyPartPose(part, { theta: 0, explode: 0, removed: false }, poseA);
        applyPartPose(part, { theta, explode: 0, removed: false }, poseB);
        expect(poseB.position.toArray(), `${part.id} помечен статичным, но зависит от θ=${theta}`).toEqual(poseA.position.toArray());
        expect(poseB.rotation.toArray().slice(0, 3), `${part.id} rotation`).toEqual(poseA.rotation.toArray().slice(0, 3));
      }
    }
    // Ничего не потеряли: подвижная механика обязана попасть в список.
    expect(animated).toContain('crankshaft');
    expect(animated).toContain('piston-1');
    expect(animated.filter((id) => id.startsWith('piston-'))).toHaveLength(8);
    expect(animated.filter((id) => id.startsWith('intake-valve-'))).toHaveLength(16);
    expect(animated.filter((id) => id.startsWith('spring-'))).toHaveLength(32);
  });
});

describe('tierForDetail остаётся согласован с ползунком', () => {
  test('тиры 0..8 соответствуют уровням каталога', () => {
    for (const level of [10, 25, 50, 100, 150, 200, 300, 400, 500]) {
      expect(tierForDetail(level)).toBeGreaterThanOrEqual(0);
      expect(tierForDetail(level)).toBeLessThanOrEqual(8);
    }
    expect(mechanics.bore).toBeGreaterThan(0);
  });
});
