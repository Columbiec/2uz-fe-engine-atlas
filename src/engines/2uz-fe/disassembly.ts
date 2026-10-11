import type { DisassemblyStep } from '../../core/types';

export const disassembly: DisassemblyStep[] = [
  { title: 'Снять декоративные крышки', description: 'Освободите верхнюю часть двигателя.', parts: ['engine-cover'], sourceIds: ['toyota-block'] },
  { title: 'Снять навесное оборудование', description: 'Ремень и генератор удаляются из рабочей зоны.', parts: ['accessory-belt', 'alternator'], sourceIds: ['toyota-block'] },
  { title: 'Снять впуск', description: 'Дроссель, коллектор и восемь каналов поднимаются из развала блока.', parts: ['throttle-body', 'intake-manifold', 'runner-1', 'runner-2', 'runner-3', 'runner-4', 'runner-5', 'runner-6', 'runner-7', 'runner-8'], sourceIds: ['toyota-block'] },
  { title: 'Снять зажигание и топливную систему', description: 'Катушки, свечи, рампы и форсунки извлекаются группой.', parts: ['coil-', 'plug-', 'fuel-rail-', 'injector-'], sourceIds: ['toyota-block'] },
  { title: 'Открыть привод ГРМ', description: 'Снимите передние кожухи.', parts: ['timing-cover-'], sourceIds: ['toyota-timing'] },
  { title: 'Снять ремень и ролики ГРМ', description: 'Учебная группировка операций; установочные метки и сервисные проверки здесь не показаны.', parts: ['timing-belt', 'timing-tensioner', 'timing-idler', 'cam-pulley-', 'crank-pulley'], sourceIds: ['toyota-timing'] },
  { title: 'Снять клапанные крышки', description: 'Открывается верхний клапанный механизм обоих рядов.', parts: ['valve-cover-'], sourceIds: ['toyota-proper'] },
  { title: 'Снять распределительные валы', description: 'Валы и межвальные шестерни отделяются от головок.', parts: ['cam-intake-', 'cam-exhaust-', 'gear-'], sourceIds: ['toyota-block'] },
  { title: 'Снять головки блока', description: 'Головки, клапанный механизм и прокладки разводятся в стороны.', parts: ['head-', 'gasket-', 'head-bolt-', 'intake-valve-', 'exhaust-valve-', 'spring-', 'bucket-'], sourceIds: ['toyota-block'] },
  { title: 'Снять масляный поддон', description: 'Открывается нижняя часть кривошипного механизма.', parts: ['oil-pan'], sourceIds: ['toyota-block'] },
  { title: 'Снять элементы смазки', description: 'Маслоприёмник, насос и фильтр отделяются от блока.', parts: ['oil-pickup', 'oil-pump', 'oil-filter'], sourceIds: ['toyota-block'] },
  { title: 'Извлечь поршни и шатуны', description: 'Восемь комплектов разнесены по осям цилиндров.', parts: ['piston-', 'pin-', 'rod-'], sourceIds: ['toyota-block'] },
  { title: 'Снять коленчатый вал', description: 'После коренных опор вал опускается из блока.', parts: ['main-bearing-', 'crankshaft'], sourceIds: ['toyota-block'] },
];

