/**
 * Генерирует QA_REPORT.md — отчёт о метриках атласа.
 *
 * Запуск:
 *   npm run qa:report
 *
 * Геометрические метрики и число draw call детерминированы: они выводятся из каталога
 * деталей, матрицы LOD и тех же правил видимости/материалов, что и в рантайме
 * (`src/viewer/parts/materials.ts`). Поэтому отчёт можно пересобирать и сравнивать
 * между коммитами. Показатели FPS зависят от GPU, поэтому здесь фиксируется только
 * метод замера и последний эталонный прогон из REFERENCE_RUN.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Mesh } from 'three';
import { engine2uz } from '../src/engines/2uz-fe';
import { PISTON_GEOMETRY, derivedPistonClearanceMm } from '../src/data/engine/pistonGeometry';
import { configuration } from '../src/data/documentation/configuration';
import { buildPartGeometry, releaseBuiltGeometry } from '../src/viewer/geometry/buildPart';
import { geometryCache } from '../src/viewer/geometry/cache';
import { detailLevels } from '../src/data/parts/detail';
import { defaultSceneState, partFlags, partVisible } from '../src/viewer/parts/materials';
import type { GeometryTier } from '../src/viewer/geometry/lod';

/** Эталонный прогон. ВАЖНО: headless Chromium по умолчанию рисует через SwiftShader
 *  (CPU), и на нём та же сцена даёт ~1 fps вместо стабильных 60 fps на GPU. Поэтому
 *  `npm run probe:fps` теперь запрашивает аппаратный рендеринг и печатает фактический
 *  рендерер. Сравнивать прогоны можно только внутри одного режима. */
const REFERENCE_RUN = {
  date: '2026-08-01',
  host: 'macOS, Apple M1 Max',
  renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Max)',
  mode: 'аппаратный (Metal через ANGLE)',
  viewport: '1440×900',
  command: 'npm run probe:fps',
  samples: [
    { level: '10%', fpsStopped: 60, fpsRunning: 60 },
    { level: '100%', fpsStopped: 60, fpsRunning: 60 },
    { level: '200%', fpsStopped: 60, fpsRunning: 60 },
    { level: '500%', fpsStopped: 60, fpsRunning: 60 },
  ],
  /** Тот же билд в режиме браузера по умолчанию (SwiftShader) — для контраста. */
  softwareComparison: [
    { level: '10%', fpsRunning: 14 },
    { level: '100%', fpsRunning: 9 },
    { level: '200%', fpsRunning: 4 },
    { level: '500%', fpsRunning: 1 },
  ],
};

interface TierMetrics {
  tier: number;
  level: number;
  parts: number;
  meshes: number;
  uniqueGeometry: number;
  triangles: number;
  gpuBytes: number;
}

function measureTier(tier: GeometryTier): TierMetrics {
  const scene = defaultSceneState(Object.fromEntries(engine2uz.systems.map((s) => [s.id, true])));
  const built: ReturnType<typeof buildPartGeometry>[] = [];
  const geometry = new Set<string>();
  let meshes = 0;
  const visible = engine2uz.parts.filter((part) => part.minimumDetailLevel <= detailLevels[tier]! && partVisible(part, partFlags(part, scene)));
  for (const part of visible) {
    const result = buildPartGeometry(part, tier);
    built.push(result);
    result.group.traverse((object) => {
      if (!(object as Mesh).isMesh) return;
      meshes++;
      geometry.add((object as Mesh).geometry.uuid);
    });
  }
  // sceneTris/sceneBytes учитывают, что одна геометрия используется несколькими
  // деталями: это тот объём, который уходит на GPU. Считать нужно до release().
  const triangles = geometryCache.sceneTris();
  const gpuBytes = geometryCache.sceneBytes();
  for (const result of built) releaseBuiltGeometry(result);
  geometryCache.flush();

  return { tier, level: detailLevels[tier]!, parts: visible.length, meshes, uniqueGeometry: geometry.size, triangles, gpuBytes };
}

/** Считает объявления тестов, а не фактические кейсы: `it.each` разворачивается
 *  в несколько прогонов, поэтому точное число печатает сам vitest. */
function countTests(path: string): number {
  const source = readFileSync(join(ROOT, path), 'utf8');
  return (source.match(/(?:^|[^\w.])(?:it|test)(?:\.(?:each|skip|only|todo|concurrent|fails|runIf|skipIf))?\s*\(/g) ?? []).length;
}

const ROOT = join(import.meta.dirname, '..');
const nf = (value: number): string => value.toLocaleString('ru-RU');
const mb = (bytes: number): string => `${(bytes / 1048576).toFixed(1)} MB`;

const tiers: GeometryTier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const metrics = tiers.map(measureTier);

const unitTestFiles = ['tests/engine.test.ts', 'tests/geometry.test.ts', 'tests/exports.test.ts', 'tests/parts.test.ts'];
const unitTestDeclarations = unitTestFiles.reduce((total, file) => total + countTests(file), 0);
const e2eScenarios = countTests('tests/e2e/atlas.spec.ts');

const { min, max } = configuration.verified.pistonOilClearanceMm;

const lines = [
  '# QA_REPORT',
  '',
  'Отчёт сгенерирован командой `npm run qa:report`. Не редактируйте вручную:',
  'метрики геометрии пересчитываются из каталога деталей и матрицы LOD.',
  '',
  '## Автоматические проверки',
  '',
  `- Unit-тесты (vitest): ${unitTestDeclarations} объявлений в ${unitTestFiles.length} файлах — \`npm test\``,
  `- E2E (Playwright): ${e2eScenarios} сценария × 2 проекта (desktop + mobile) — \`npm run test:e2e\``,
  '- Полный гейт перед публикацией: `npm run check` (typecheck → lint → unit → build)',
  '',
  'Число объявлений меньше числа прогонов: `it.each` и параметризованные проекты',
  'Playwright разворачиваются в несколько кейсов. Точные цифры печатает сам раннер.',
  '',
  '## Геометрия и draw call по тирам детализации',
  '',
  '«Сеток» — столько объектов `THREE.Mesh` попадает в сцену, то есть столько draw call',
  'отправляют детали двигателя (без gizmo, неба и земли). «Уникальных геометрий» —',
  'сколько `BufferGeometry` реально создано: однотипные детали (8 поршней, 32 клапана,',
  '40 болтов) переиспользуют их из refcount-кэша, поэтому буферов на порядок меньше.',
  '«Треугольников» и «GPU-буферы» учитывают переиспользование: одна геометрия,',
  'надетая на несколько деталей, считается столько раз, сколько деталей её рисуют.',
  '',
  '| Тир | Ползунок | Деталей | Сеток (draw call) | Уникальных геометрий | Треугольников | GPU-буферы |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...metrics.map((m) => `| ${m.tier} | ${m.level}% | ${nf(m.parts)} | ${nf(m.meshes)} | ${nf(m.uniqueGeometry)} | ${nf(m.triangles)} | ${mb(m.gpuBytes)} |`),
  '',
  `Каталог содержит **${nf(engine2uz.parts.length)}** деталей; на максимальном тире в сцену`,
  `попадают все, и суммарный объём нарисованной геометрии достигает ~${nf(metrics[8]!.triangles)} треугольников`,
  `при ${nf(metrics[8]!.uniqueGeometry)} уникальных буферах геометрии.`,
  '',
  '## Производительность',
  '',
  'FPS зависит от GPU и от режима рендеринга браузера, поэтому не вычисляется здесь.',
  'Метод замера:',
  '',
  '```bash',
  'npm run build && npm run preview   # в одном терминале',
  'npm run probe:fps                  # в другом; печатает фактический рендерер',
  '```',
  '',
  `**Режим рендеринга решающий.** По умолчанию headless Chromium использует SwiftShader`,
  '(растеризация на CPU), и та же сцена показывает ~1 fps вместо стабильных 60 fps на GPU.',
  'Все замеры, сделанные в этом режиме, описывают программный растеризатор, а не',
  'устройство пользователя. `npm run probe:fps` поэтому запрашивает аппаратный рендеринг',
  '(`--use-gl=angle`), а `npm run probe:fps -- --software` воспроизводит программный режим.',
  '',
  `Эталонный прогон: ${REFERENCE_RUN.date}, ${REFERENCE_RUN.host}, режим — ${REFERENCE_RUN.mode}, окно ${REFERENCE_RUN.viewport}.`,
  'Фактический рендерер:',
  '',
  '```',
  REFERENCE_RUN.renderer,
  '```',
  '',
  '| Ползунок | FPS (остановлен) | FPS (работает) |',
  '| --- | --- | --- |',
  ...REFERENCE_RUN.samples.map((s) => `| ${s.level} | ${s.fpsStopped} | ${s.fpsRunning} |`),
  '',
  'Тот же билд в режиме по умолчанию (SwiftShader) для контраста:',
  '',
  '| Ползунок | FPS (работает), программный растеризатор |',
  '| --- | --- |',
  ...REFERENCE_RUN.softwareComparison.map((s) => `| ${s.level} | ${s.fpsRunning} |`),
  '',
  'Совпадение FPS в колонках «остановлен» и «работает» означает, что кадр ограничен',
  'не перерисовкой интерфейса React: при остановленном двигателе позы деталей вообще',
  'не пересчитываются.',
  '',
  '## Подтверждённые величины',
  '',
  'Числа не дублируются по коду: источник — `configuration.verified`, остальное выводится.',
  '',
  `- Диаметр цилиндра STD Mark 1: ${configuration.verified.cylinderBoreMark1Mm.min}–${configuration.verified.cylinderBoreMark1Mm.max} мм`,
  `- Диаметр поршня STD Mark 1: ${configuration.verified.pistonDiameterMark1Mm.min}–${configuration.verified.pistonDiameterMark1Mm.max} мм`,
  `- Зазор поршень–цилиндр по документации: ${min}–${max} мм`,
  `- Зазор, выведенный из геометрии модели: **${derivedPistonClearanceMm.toFixed(3)} мм**`,
  `- Радиус поршня в сцене: ${PISTON_GEOMETRY.radius.toFixed(6)} ед., радиус цилиндра: ${PISTON_GEOMETRY.cylinderBoreRadius.toFixed(6)} ед.`,
  '',
  'Соответствие выведенного зазора подтверждённому диапазону проверяется тестом',
  '`tests/engine.test.ts` — при изменении любого из диаметров он упадёт.',
  '',
];

writeFileSync(join(ROOT, 'QA_REPORT.md'), lines.join('\n'));
console.log(`qa-report: QA_REPORT.md обновлён (${metrics.length} тиров, ${unitTestDeclarations} объявлений unit-тестов)`);
