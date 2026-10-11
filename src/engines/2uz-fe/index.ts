import type { EnginePackage } from '../../core/types';
import { configuration } from '../../data/documentation/configuration';
import { firingOrder } from '../../data/engine/kinematics';
import { parts } from './parts';
import { systems } from './systems';
import { specifications } from './specifications';
import { disassembly } from './disassembly';
import { lessons } from './lessons';

export const engine2uz: EnginePackage = {
  id: '2uz-fe', name: '2UZ-FE', variant: '2003 Toyota Tundra 2UZ-FE non-VVT-i', modelYear: '2003', market: 'USA · Tundra · RM956U', vvti: false,
  parts, systems, specifications, disassembly, lessons,
  // Порядок работы и размеры не дублируются: источник — configuration.verified.
  firingOrder, boreMm: configuration.verified.boreMm.value, strokeMm: configuration.verified.strokeMm.value,
  model: { type: 'procedural', license: 'Original project geometry · MIT', units: 'educational scale', note: 'Составная процедурная реконструкция 2UZ‑FE. Пропорции и расположение систем предназначены для обучения, не для измерений или ремонта.' },
};

