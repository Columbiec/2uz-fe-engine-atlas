import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * Экспортированный символ, который никто не импортирует и не использует, — это мёртвый
 * код в бандле и ложное обещание API. `noUnusedLocals` такие символы не видит, поэтому
 * проверяем явно: у каждого экспорта значения должен быть хотя бы один потребитель
 * за пределами собственного объявления.
 *
 * Типы и интерфейсы намеренно не проверяются: они стираются при сборке и могут
 * существовать как публичный контракт пакета.
 */

const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['src', 'tests', 'scripts'];
const SOURCE_RE = /\.(ts|tsx|mts|js|mjs|cjs)$/;

/** Экспорты, которые существуют как публичный контракт и намеренно не имеют
 *  внутреннего потребителя. Сейчас список пуст: любой новый экспорт обязан быть
 *  использован, иначе тест падает. */
const PUBLIC_API_ALLOWLIST = new Set<string>([]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (SOURCE_RE.test(path)) out.push(path);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
/** Комментарии не считаются использованием: упоминание в пояснении — не потребитель. */
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const sources = new Map(files.map((path) => [relative(ROOT, path), stripComments(readFileSync(path, 'utf8'))]));

interface ExportedSymbol {
  name: string;
  file: string;
}

function collectExports(): ExportedSymbol[] {
  const found: ExportedSymbol[] = [];
  for (const [file, source] of sources) {
    const patterns = [
      /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
      /^export\s+class\s+([A-Za-z_$][\w$]*)/gm,
      /^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
      /^export\s+default\s+function\s+([A-Za-z_$][\w$]*)/gm,
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) found.push({ name: match[1]!, file });
    }
    for (const match of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
      for (const clause of match[1]!.split(',')) {
        const name = clause.trim().split(/\s+as\s+/).pop()?.trim();
        if (name && /^[A-Za-z_$][\w$]*$/.test(name)) found.push({ name, file });
      }
    }
  }
  return found;
}

function referenceCount(name: string): number {
  const pattern = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, 'g');
  let total = 0;
  for (const source of sources.values()) total += source.match(pattern)?.length ?? 0;
  return total;
}

describe('гигиена публичных экспортов', () => {
  test('каждый экспорт значения имеет потребителя', () => {
    const unused: string[] = [];
    const seen = new Set<string>();
    for (const { name, file } of collectExports()) {
      const key = `${file}#${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (PUBLIC_API_ALLOWLIST.has(name)) continue;
      // Одно вхождение — само объявление (`export const name` / `export function name`).
      if (referenceCount(name) <= 1) unused.push(`${name}  (${file})`);
    }
    expect(unused, `Мёртвые экспорты — удалите их или оставьте локальными:\n  ${unused.join('\n  ')}`).toEqual([]);
  });

  test('allowlist не содержит устаревших записей', () => {
    const exportedNames = new Set(collectExports().map((entry) => entry.name));
    const stale = [...PUBLIC_API_ALLOWLIST].filter((name) => !exportedNames.has(name));
    expect(stale, `Уберите из allowlist: ${stale.join(', ')}`).toEqual([]);
  });
});
