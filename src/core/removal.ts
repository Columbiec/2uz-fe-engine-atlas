import type { EnginePart } from './types';
import { partById } from '../engines/2uz-fe/parts';

/**
 * Считает деталь снятой, если она сама или любой её предок попал в шаги разборки
 * вплоть до текущего. Шаблон с завершающим дефисом означает группу по префиксу id.
 */
export function isRemoved(part: EnginePart, step: number, steps: { parts: string[] }[]): boolean {
  const ancestors: EnginePart[] = [];
  let current: EnginePart | undefined = part;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    ancestors.push(current);
    current = current.parent ? partById[current.parent] : undefined;
  }
  const applied = steps.slice(0, step + 1);
  return ancestors.some((candidate) => applied.some((entry) =>
    entry.parts.some((pattern) => candidate.id === pattern || (pattern.endsWith('-') && candidate.id.startsWith(pattern)))));
}

/** Набор снятых деталей для текущего шага разборки. Пересчитывается только при
 *  смене шага, а не каждый кадр. */
export function removedPartIds(parts: EnginePart[], step: number, steps: { parts: string[] }[]): ReadonlySet<string> {
  return new Set(parts.filter((part) => isRemoved(part, step, steps)).map((part) => part.id));
}
