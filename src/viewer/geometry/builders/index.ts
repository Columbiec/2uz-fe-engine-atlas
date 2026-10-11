import type { PartKind } from '../../../core/types';
import type { BuildCtx } from './cranktrain';
import {
  pistonBuilder, crankBuilder, pinBuilder, rodBuilder, mainCapBuilder, rodCapBuilder, bearingBuilder, ringBuilder,
} from './cranktrain';
import { camBuilder, valveBuilder, springBuilder, bucketBuilder, retainerShimBuilder, guideBuilder, seatBuilder } from './valvetrain';
import { pulleyBuilder, beltBuilder, timingCoverBuilder, gearBuilder } from './timing';
import { blockBuilder, headBuilder, coverBuilder, gasketBuilder, panBuilder, pickupBuilder } from './housings';
import {
  plenumBuilder, runnerBuilder, exhaustBuilder, throttleBuilder, pumpBuilder, filterBuilder, railBuilder,
  injectorBuilder, plugBuilder, coilBuilder, sensorBuilder, alternatorBuilder, starterBuilder, boltBuilder,
  pipeBuilder, hydraulicTensionerBuilder,
} from './auxiliary';
import type { Group } from 'three';
import type { EnginePart } from '../../../core/types';

export type PartBuild = { group: Group; keys: string[] };
export type KindBuilder = (part: EnginePart, ctx: BuildCtx) => PartBuild;

export const KIND_BUILDERS: Record<PartKind, KindBuilder> = {
  block: blockBuilder,
  head: headBuilder,
  cover: coverBuilder,
  gasket: gasketBuilder,
  pan: panBuilder,
  pickup: pickupBuilder,
  piston: pistonBuilder,
  pin: pinBuilder,
  rod: rodBuilder,
  crank: crankBuilder,
  bearing: bearingBuilder,
  mainCap: mainCapBuilder,
  rodCap: rodCapBuilder,
  ring: ringBuilder,
  cam: camBuilder,
  valve: valveBuilder,
  spring: springBuilder,
  bucket: bucketBuilder,
  retainer: retainerShimBuilder,
  shim: retainerShimBuilder,
  guide: guideBuilder,
  seat: seatBuilder,
  pulley: pulleyBuilder,
  belt: beltBuilder,
  timingCover: timingCoverBuilder,
  gear: gearBuilder,
  plenum: plenumBuilder,
  runner: runnerBuilder,
  exhaust: exhaustBuilder,
  throttle: throttleBuilder,
  pump: pumpBuilder,
  filter: filterBuilder,
  rail: railBuilder,
  injector: injectorBuilder,
  plug: plugBuilder,
  coil: coilBuilder,
  sensor: sensorBuilder,
  alternator: alternatorBuilder,
  starter: starterBuilder,
  bolt: boltBuilder,
  pipe: pipeBuilder,
  hydraulicTensioner: hydraulicTensionerBuilder,
};