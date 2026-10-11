import { Group } from 'three';
import type { EnginePart } from '../../../core/types';
import { boxMesh, cylMesh, torusMesh } from './util';
import { hasFeature } from '../budgets';
import { ribPlate, bossCyl, grooveRing } from './features';
import type { BuildCtx } from './cranktrain';

export function plenumBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  group.add(boxMesh(keys, 'plenum', ctx.tier, seg, 1.65, 0.58, 3.9, undefined, undefined, undefined, undefined, undefined, 'lower'));
  group.add(boxMesh(keys, 'plenum', ctx.tier, seg, 1.1, 0.25, 3.25, [0, 0.37, 0], undefined, undefined, 1, undefined, 'upper'));
  if (hasFeature('plenum', ctx.tier, 'RIB')) {
    for (const x of [-0.87, 0.87]) {
      ribPlate(keys, 'plenum', ctx.tier, seg, 0.08, 0.7, 3.0, [x, 0, 0], undefined, `side${x}`);
    }
  }
  if (hasFeature('plenum', ctx.tier, 'BOSS')) {
    for (const [x, z] of [[-0.4, -1.2], [0.4, -1.2], [-0.4, 1.2], [0.4, 1.2]] as const) {
      group.add(bossCyl(keys, 'plenum', ctx.tier, seg, 0.24, 0.14, [x, 0.52, z], undefined, `tb${x}${z}`));
    }
  }
  if (hasFeature('plenum', ctx.tier, 'GROOVE')) {
    for (const z of [-0.8, 0, 0.8]) {
      ribPlate(keys, 'plenum', ctx.tier, seg, 0.7, 0.045, 0.3, [0, 0.52, z], undefined, `fin${z}`);
    }
  }
  return { group, keys };
}

export function runnerBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(torusMesh(keys, 'runner', ctx.tier, ctx.seg, 0.78, 0.105, undefined, [0, 0, Math.PI / 2], Math.PI * 0.72, 1, 'tube'));
  return { group, keys };
}

export function exhaustBuilder(part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const seg = ctx.seg;
  // Локальная ось X направлена наружу от развала блока. Четыре первичные трубы
  // сходятся к продольному коллектору на внешней стороне каждой ГБЦ.
  const side = part.bank === 1 ? 1 : -1;
  const primaryAngle = side * 2.43;
  const primaryLength = 0.57;
  const portZ = [-1.58, -0.53, 0.53, 1.58];
  for (const z of portZ) {
    // Диагональный участок идёт от выпускного окна к коллектору, а не образует
    // отдельное кольцо в плоскости головки, как это было раньше.
    group.add(cylMesh(keys, 'exhaust', ctx.tier, seg, 0.105, 0.105, primaryLength, [side * 0.235, 0.335, z], [0, 0, primaryAngle], 1, false, `primary${z}`));
    group.add(boxMesh(keys, 'exhaust', ctx.tier, seg, 0.075, 0.26, 0.36, [side * 0.025, 0.555, z], [0, 0, primaryAngle], 1, 1, 1, `portFlange${z}`));
    if (hasFeature('exhaust', ctx.tier, 'FILLET')) {
      group.add(torusMesh(keys, 'exhaust', ctx.tier, seg, 0.108, 0.018, [side * 0.415, 0.12, z], [0, Math.PI / 2, 0], Math.PI * 2, 0.45, `merge${z}`));
    }
  }
  // Продольный коллектор совпадает с осью цилиндров (+Z) и связывает все четыре
  // первичные трубы в одну собранную выпускную систему.
  group.add(cylMesh(keys, 'exhaust', ctx.tier, seg, 0.17, 0.17, 3.85, [side * 0.42, 0.12, 0], [Math.PI / 2, 0, 0], 1, false, 'collector'));
  group.add(cylMesh(keys, 'exhaust', ctx.tier, seg, 0.2, 0.17, 0.32, [side * 0.42, 0.12, 2.08], [Math.PI / 2, 0, 0], 1, false, 'outlet'));
  if (hasFeature('exhaust', ctx.tier, 'CHAMFER')) {
    for (const z of [-1.92, 1.92]) {
      group.add(torusMesh(keys, 'exhaust', ctx.tier, seg, 0.17, 0.022, [side * 0.42, 0.12, z], [Math.PI / 2, 0, 0], Math.PI * 2, 0.5, `collectorRim${z}`));
    }
  }
  if (hasFeature('exhaust', ctx.tier, 'RIB')) {
    for (const z of [-1.1, 0, 1.1]) {
      ribPlate(keys, 'exhaust', ctx.tier, seg, 0.11, 0.22, 0.08, [side * 0.42, 0.12, z], [0, 0, primaryAngle], `brace${z}`);
    }
  }
  return { group, keys };
}

export function throttleBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'throttle', ctx.tier, ctx.seg, 0.44, 0.44, 0.48, undefined, [Math.PI / 2, 0, 0], 1, false, 'body'));
  return { group, keys };
}

export function pumpBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'pump', ctx.tier, ctx.seg, 0.52, 0.52, 0.26, undefined, [Math.PI / 2, 0, 0], 1, false, 'housing'));
  group.add(cylMesh(keys, 'pump', ctx.tier, ctx.seg, 0.12, 0.12, 0.12, [0, 0, 0.17], [Math.PI / 2, 0, 0], 1, false, 'shaft'));
  return { group, keys };
}

export function filterBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  const { tier, seg } = ctx;
  // Корпус фильтра имеет отдельные завальцованный стакан, опорную плиту,
  // уплотнение и центральный посадочный узел — это не просто гладкий цилиндр.
  group.add(cylMesh(keys, 'filter', tier, seg, 0.235, 0.245, 0.58, [0, 0.01, 0], undefined, 1, false, 'can'));
  group.add(cylMesh(keys, 'filter', tier, seg, 0.235, 0.215, 0.09, [0, 0.345, 0], undefined, 1, false, 'dome'));
  group.add(cylMesh(keys, 'filter', tier, seg, 0.225, 0.225, 0.06, [0, -0.31, 0], undefined, 1, false, 'basePlate'));
  group.add(cylMesh(keys, 'filter', tier, seg, 0.125, 0.125, 0.085, [0, -0.38, 0], undefined, 1, false, 'mountingBoss'));
  group.add(torusMesh(keys, 'filter', tier, seg, 0.236, 0.018, [0, -0.275, 0], undefined, Math.PI * 2, 0.5, 'rolledRim'));
  group.add(torusMesh(keys, 'filter', tier, seg, 0.188, 0.017, [0, -0.415, 0], undefined, Math.PI * 2, 0.5, 'gasket'));
  if (hasFeature('filter', tier, 'GROOVE')) {
    for (const y of [-0.14, 0.05, 0.22]) {
      grooveRing(keys, 'filter', tier, seg, 0.246, 0.009, [0, y, 0], undefined, Math.PI * 2, `stamp${y}`);
    }
  }
  if (hasFeature('filter', tier, 'RIB')) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      group.add(boxMesh(keys, 'filter', tier, seg, 0.025, 0.42, 0.052, [Math.cos(a) * 0.232, 0.03, Math.sin(a) * 0.232], [0, -a, 0], 1, 1, 1, `stampedRib${i}`));
    }
  }
  return { group, keys };
}

export function railBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'rail', ctx.tier, ctx.seg, 0.07, 0.07, 4.25, undefined, [Math.PI / 2, 0, 0], 1, false, 'rail'));
  return { group, keys };
}

export function injectorBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'injector', ctx.tier, ctx.seg, 0.065, 0.05, 0.38, undefined, undefined, 1, false, 'nozzle'));
  group.add(boxMesh(keys, 'injector', ctx.tier, ctx.seg, 0.15, 0.12, 0.13, [0, 0.22, 0], undefined, undefined, undefined, undefined, 'body'));
  return { group, keys };
}

export function plugBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'plug', ctx.tier, ctx.seg, 0.055, 0.04, 0.45, undefined, undefined, 1, false, 'thread'));
  group.add(cylMesh(keys, 'plug', ctx.tier, ctx.seg, 0.09, 0.09, 0.08, [0, 0.12, 0], undefined, 0.7, false, 'hex'));
  return { group, keys };
}

export function coilBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(boxMesh(keys, 'coil', ctx.tier, ctx.seg, 0.22, 0.5, 0.22, undefined, undefined, undefined, undefined, undefined, 'body'));
  group.add(cylMesh(keys, 'coil', ctx.tier, ctx.seg, 0.055, 0.07, 0.3, [0, -0.35, 0], undefined, 1, false, 'boot'));
  return { group, keys };
}

export function sensorBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'sensor', ctx.tier, ctx.seg, 0.1, 0.1, 0.22, undefined, undefined, 1, false, 'barrel'));
  group.add(boxMesh(keys, 'sensor', ctx.tier, ctx.seg, 0.17, 0.2, 0.15, [0, 0.18, 0], undefined, undefined, undefined, undefined, 'conn'));
  return { group, keys };
}

export function alternatorBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'alternator', ctx.tier, ctx.seg, 0.48, 0.48, 0.65, undefined, [Math.PI / 2, 0, 0], 1, false, 'body'));
  group.add(cylMesh(keys, 'alternator', ctx.tier, ctx.seg, 0.23, 0.23, 0.12, [0, 0, 0.38], [Math.PI / 2, 0, 0], 1, false, 'nose'));
  return { group, keys };
}

export function starterBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.rotation.z = Math.PI / 2;
  group.add(cylMesh(keys, 'starter', ctx.tier, ctx.seg, 0.28, 0.28, 0.9, undefined, undefined, 1, false, 'motor'));
  group.add(cylMesh(keys, 'starter', ctx.tier, ctx.seg, 0.15, 0.15, 0.52, [0.35, 0.3, 0], undefined, 1, false, 'gearbox'));
  return { group, keys };
}

export function boltBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'bolt', ctx.tier, ctx.seg, 0.045, 0.045, 0.7, undefined, undefined, 1, false, 'shank'));
  group.add(cylMesh(keys, 'bolt', ctx.tier, ctx.seg, 0.085, 0.085, 0.09, [0, 0.38, 0], undefined, 0.7, false, 'head'));
  return { group, keys };
}

export function pipeBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'pipe', ctx.tier, ctx.seg, 0.07, 0.07, 3.5, undefined, [Math.PI / 2, 0, 0], 1, true, 'pipe'));
  return { group, keys };
}

export function hydraulicTensionerBuilder(_part: EnginePart, ctx: BuildCtx): { group: Group; keys: string[] } {
  const keys: string[] = [];
  const group = new Group();
  group.add(cylMesh(keys, 'hydraulicTensioner', ctx.tier, ctx.seg, 0.09, 0.09, 0.35, undefined, undefined, 1, false, 'body'));
  group.add(cylMesh(keys, 'hydraulicTensioner', ctx.tier, ctx.seg, 0.035, 0.035, 0.17, [0, 0.23, 0], undefined, 1, false, 'plunger'));
  return { group, keys };
}
