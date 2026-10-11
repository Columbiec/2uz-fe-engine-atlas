/**
 * Замер производительности атласа на собранной сборке.
 *
 * Запуск (нужен свежий `npm run build` и работающий `npm run preview`):
 *   npm run probe:fps
 *   npm run probe:fps -- --software          # принудительно программный растеризатор
 *   npm run probe:fps -- --url http://127.0.0.1:4173 --out output/playwright
 *
 * ВАЖНО про режим рендеринга. Headless Chromium по умолчанию рисует через SwiftShader,
 * то есть на CPU: те же 5M треугольников дают ~1 fps вместо стабильных 60 fps на GPU.
 * Раньше замеры делались именно так и показывали несуществующую проблему
 * производительности. Поэтому по умолчанию скрипт просит у Chromium аппаратный
 * рендеринг (ANGLE) и печатает, какой рендерер фактически получен. Сравнивать между
 * собой можно только прогоны с одинаковым полем `renderer`.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

/** Флаги, включающие аппаратный путь в headless Chromium (проверено на macOS/Metal). */
const GPU_ARGS = ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const SOFTWARE_ARGS = ['--use-gl=swiftshader'];

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const hasFlag = (name) => argv.includes(`--${name}`);

const baseUrl = flag('url', process.env.ATLAS_URL ?? 'http://127.0.0.1:4173');
const outDir = flag('out', 'output/playwright');
const viewport = { width: 1440, height: 900 };
const levels = [
  { slider: 0, label: '10%' },
  { slider: 3, label: '100%' },
  { slider: 5, label: '200%' },
  { slider: 8, label: '500%' },
];

mkdirSync(outDir, { recursive: true });

const software = hasFlag('software');
const browser = await chromium.launch({ args: software ? SOFTWARE_ARGS : GPU_ARGS });
const page = await browser.newPage({ viewport, locale: 'ru-RU' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(baseUrl, { waitUntil: 'load' });
await page.waitForSelector('.viewer canvas');
await page.waitForTimeout(2500);

const readFps = async (sampleMs = 3500) => {
  await page.waitForTimeout(sampleMs);
  return Number(await page.locator('canvas').getAttribute('data-fps') ?? 0);
};

/** Какой рендерер реально достался браузеру — без этого сравнивать прогоны нельзя. */
const renderer = await page.evaluate(() => {
  // Колбэк выполняется в контексте страницы, а не в Node: document здесь доступен.
  // eslint-disable-next-line no-undef
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return 'no webgl2';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
});

await page.locator('.technical-controls summary').click();
const detail = page.getByLabel('Техническая детализация');

const samples = [];
for (const { slider, label } of levels) {
  await detail.fill(String(slider));
  await page.waitForTimeout(2500);
  const stopped = await readFps();
  await page.locator('.engine-start').click();
  const running = await readFps();
  await page.locator('.engine-start').click();
  await page.waitForTimeout(600);
  const partsRendered = Number(await page.locator('canvas').getAttribute('data-parts-rendered') ?? 0);
  samples.push({ level: label, fpsStopped: stopped, fpsRunning: running, partsRendered });
  console.log(`${label}: stopped=${stopped}fps running=${running}fps parts=${partsRendered}`);
}

await detail.fill('8');
await page.waitForTimeout(2500);
await page.locator('.camera-controls button[title="iso"]').click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/probe-500-iso.png` });
await detail.fill('0');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/probe-10-iso.png` });

await browser.close();

const report = { url: baseUrl, viewport, renderer, requestedHardware: !software, samples, errors: errors.slice(0, 10) };
console.log(JSON.stringify(report, null, 2));
