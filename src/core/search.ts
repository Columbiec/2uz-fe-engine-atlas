import type { EnginePart } from './types';

export const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, ' ').trim();
export function searchParts(parts: EnginePart[], query: string) {
  const q = normalize(query);
  if (!q) return parts.filter((p) => ['crankshaft', 'piston-1', 'timing-belt', 'oil-pump', 'water-pump', 'throttle-body'].includes(p.id));
  const tokens = q.split(' ');
  return parts.map((part) => {
    const fields = [part.nameRu, part.name, part.id, part.system, ...part.tags, part.function, ...part.technicalNotes].map(normalize);
    const score = tokens.reduce((total, token) => total + fields.reduce((best, field, index) => Math.max(best, field === token ? 12 - index : field.startsWith(token) ? 8 - Math.min(index, 5) : field.includes(token) ? 4 : 0), 0), 0);
    return { part, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.part.nameRu.localeCompare(b.part.nameRu, 'ru')).map((x) => x.part);
}

