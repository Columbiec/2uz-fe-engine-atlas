/**
 * Самохостинг шрифтов: скачивает woff2 из Google Fonts и генерирует `src/fonts.css`.
 *
 * Зачем: `@import url('https://fonts.googleapis.com/...')` блокирует отрисовку и не
 * работает офлайн, из-за чего PWA-оболочка оставалась без фирменных шрифтов.
 *
 * Запуск (нужен доступ в сеть, только при обновлении шрифтов):
 *   npm run fetch:fonts
 *
 * Manrope и Roboto Mono — вариативные шрифты: один файл на подмножество покрывает
 * весь диапазон весов, поэтому @font-face объявляет `font-weight: <min> <max>`.
 * Если объявить отдельные правила на каждый вес с одним и тем же файлом, браузер
 * не применит ось wght и полужирные начертания отрисуются как обычные.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = join(ROOT, 'src/assets/fonts');
const CSS_PATH = join(ROOT, 'src/fonts.css');

/** Подмножества, которые реально нужны интерфейсу: латиница, расширенная латиница
 *  (типографика вроде «·») и кириллица. Greek/vietnamese/cyrillic-ext не берём. */
const KEEP_SUBSETS = new Set(['latin', 'latin-ext', 'cyrillic']);

const FAMILIES = [
  { family: 'Manrope', axis: 'wght@400..700' },
  { family: 'Roboto Mono', axis: 'wght@400..500' },
];

/** Chrome UA обязателен: без него Google Fonts отдаёт ttf вместо woff2. */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const query = FAMILIES.map(({ family, axis }) => `family=${encodeURIComponent(family)}:${axis}`).join('&');
const cssUrl = `https://fonts.googleapis.com/css2?${query}&display=swap`;

const response = await fetch(cssUrl, { headers: { 'User-Agent': USER_AGENT } });
if (!response.ok) throw new Error(`Google Fonts CSS: HTTP ${response.status}`);
const css = await response.text();

const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
if (!blocks.length) throw new Error('Не удалось разобрать ответ Google Fonts CSS API');

mkdirSync(FONT_DIR, { recursive: true });
const written = new Set();
const rules = [
  '/* Сгенерировано `npm run fetch:fonts` — не редактировать вручную.',
  ' * Локальные шрифты вместо @import с fonts.googleapis.com: сборка не зависит',
  ' * от внешней сети, PWA работает офлайн, нет render-blocking запроса на сторонний домен.',
  ' */',
  '',
];

for (const [, subset, block] of blocks) {
  if (!KEEP_SUBSETS.has(subset)) continue;
  const family = /font-family:\s*'([^']+)'/.exec(block)?.[1];
  const weightRange = /font-weight:\s*([\d ]+);/.exec(block)?.[1]?.trim();
  const url = /url\((https:[^)]+)\)/.exec(block)?.[1];
  const unicodeRange = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
  if (!family || !weightRange || !url || !unicodeRange) continue;

  const slug = `${family.toLowerCase().replace(/\s+/g, '-')}-${subset}.woff2`;
  if (!written.has(slug)) {
    const font = await fetch(url);
    if (!font.ok) throw new Error(`${family} ${subset}: HTTP ${font.status}`);
    writeFileSync(join(FONT_DIR, slug), Buffer.from(await font.arrayBuffer()));
    written.add(slug);
  }

  rules.push('@font-face {');
  rules.push(`  font-family: '${family}';`);
  rules.push('  font-style: normal;');
  rules.push(`  font-weight: ${weightRange};`);
  rules.push('  font-display: swap;');
  rules.push(`  src: url('./assets/fonts/${slug}') format('woff2');`);
  rules.push(`  unicode-range: ${unicodeRange};`);
  rules.push('}');
  rules.push('');
}

writeFileSync(CSS_PATH, rules.join('\n'));

// Убираем файлы прошлых запусков, чтобы в репозитории не копились осиротевшие шрифты.
for (const entry of readdirSync(FONT_DIR)) {
  if (entry.endsWith('.woff2') && !written.has(entry)) rmSync(join(FONT_DIR, entry));
}

console.log(`fetch-fonts: ${written.size} файлов в src/assets/fonts, ${written.size} правил @font-face в src/fonts.css`);
