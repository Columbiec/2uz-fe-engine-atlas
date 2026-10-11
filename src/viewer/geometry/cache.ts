import * as THREE from 'three';

export interface GeometryEntry {
  geo: THREE.BufferGeometry;
  refs: number;
  tris: number;
  verts: number;
  bytes: number;
}

interface CacheEntry extends GeometryEntry {
  timer: ReturnType<typeof setTimeout> | null;
}

const DISPOSE_DELAY_MS = 500;

function computeBytes(geo: THREE.BufferGeometry): number {
  let bytes = 0;
  for (const name of Object.keys(geo.attributes)) {
    bytes += (geo.attributes[name] as THREE.BufferAttribute).array.byteLength;
  }
  if (geo.index) bytes += geo.index.array.byteLength;
  return bytes;
}

export function countTris(geo: THREE.BufferGeometry): number {
  if (geo.index) return geo.index.count / 3;
  return (geo.attributes.position?.count ?? 0) / 3;
}

/** Refcount-кэш BufferGeometry с отложенным освобождением.
 * Геометрия живёт, пока на неё ссылается смонтированная деталь; при обнулении refs
 * dispose откладывается на DISPOSE_DELAY_MS — это переживает StrictMode-перемонтирование
 * в dev и короткие переключения тиров, но гарантированно освобождает GPU-память
 * после фактического ухода детали из сцены. */
class GeometryCache {
  private map = new Map<string, CacheEntry>();

  acquire(key: string, factory: () => THREE.BufferGeometry): CacheEntry {
    let entry = this.map.get(key);
    if (entry) {
      if (entry.timer !== null) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
      entry.refs++;
      return entry;
    }
    const geo = factory();
    entry = {
      geo,
      refs: 1,
      tris: countTris(geo),
      verts: geo.attributes.position?.count ?? 0,
      bytes: computeBytes(geo),
      timer: null,
    };
    this.map.set(key, entry);
    return entry;
  }

  release(key: string): void {
    const entry = this.map.get(key);
    if (!entry) return;
    entry.refs--;
    if (entry.refs <= 0 && entry.timer === null) {
      entry.timer = setTimeout(() => {
        if (this.map.get(key) === entry) this.map.delete(key);
        entry.geo.dispose();
      }, DISPOSE_DELAY_MS);
    }
  }

  releaseMany(keys: Iterable<string>): void {
    for (const key of keys) this.release(key);
  }

  peek(key: string): GeometryEntry | undefined {
    return this.map.get(key);
  }

  sum(keys: Iterable<string>): { tris: number; verts: number; bytes: number } {
    let tris = 0;
    let verts = 0;
    let bytes = 0;
    for (const key of keys) {
      const entry = this.map.get(key);
      if (entry) {
        tris += entry.tris;
        verts += entry.verts;
        bytes += entry.bytes;
      }
    }
    return { tris, verts, bytes };
  }

  stats(): { tris: number; verts: number; bytes: number; entries: number } {
    let tris = 0;
    let verts = 0;
    let bytes = 0;
    let entries = 0;
    for (const entry of this.map.values()) {
      if (entry.refs <= 0) continue;
      entries++;
      tris += entry.tris;
      verts += entry.verts;
      bytes += entry.bytes;
    }
    return { tris, verts, bytes, entries };
  }

  /** Треугольники в живой сцене с учётом числа инстансов (refs × tris).
   *  Совпадает с суммой по деталям на установившемся тире. */
  sceneTris(): number {
    let tris = 0;
    for (const entry of this.map.values()) {
      if (entry.refs <= 0) continue;
      tris += entry.tris * entry.refs;
    }
    return tris;
  }

  /** GPU-память живой сцены с учётом инстансов (refs × bytes). */
  sceneBytes(): number {
    let bytes = 0;
    for (const entry of this.map.values()) {
      if (entry.refs <= 0) continue;
      bytes += entry.bytes * entry.refs;
    }
    return bytes;
  }

  /** Немедленно освободить всё (для тестов/QA). */
  flush(): void {
    for (const [key, entry] of this.map.entries()) {
      if (entry.timer !== null) clearTimeout(entry.timer);
      this.map.delete(key);
      entry.geo.dispose();
    }
  }
}

export const geometryCache = new GeometryCache();