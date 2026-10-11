import { useEffect, useState } from 'react';
import { useEngineStore } from '../core/store';
import { geometryCache } from './geometry/cache';
import { tierForDetail, TIER_LEVELS } from './geometry/lod';
import { t, useLocale } from '../core/i18n';

const fmt = (n: number): string => n.toLocaleString('ru-RU');
const fmtSize = (b: number): string =>
  b > 1024 * 1024 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(0, Math.round(b / 1024))}KB`;

interface Hud {
  tier: number;
  percent: number;
  tris: number;
  bytes: number;
  entries: number;
  parts: number;
  fps: number;
}

/** Диагностическая плашка: реальные метрики сцены (видна при включённом debug). */
export function SceneHud() {
  useLocale();
  const debug = useEngineStore((s) => s.debug);
  const detail = useEngineStore((s) => s.detailLevel);
  const [hud, setHud] = useState<Hud>({ tier: 0, percent: 10, tris: 0, bytes: 0, entries: 0, parts: 0, fps: 0 });

  useEffect(() => {
    if (!debug) return;
    const id = window.setInterval(() => {
      const canvas = document.querySelector('.viewer canvas');
      const tier = tierForDetail(useEngineStore.getState().detailLevel);
      setHud({
        tier,
        percent: TIER_LEVELS[tier] ?? 10,
        tris: geometryCache.sceneTris(),
        bytes: geometryCache.sceneBytes(),
        entries: geometryCache.stats().entries,
        parts: Number((canvas as HTMLCanvasElement | null)?.dataset.partsRendered ?? 0),
        fps: Number((canvas as HTMLCanvasElement | null)?.dataset.fps ?? 0),
      });
    }, 300);
    return () => window.clearInterval(id);
  }, [debug, detail]);

  if (!debug) return null;
  return (
    <div className="scene-hud" aria-label="HUD отладки">
      <b>LOD {hud.tier} · {fmt(hud.percent)}%</b>
      <span>{t('Треугольники')}: {fmt(hud.tris)}</span>
      <span>{t('Кадры')}: {hud.fps} fps</span>
      <span>{t('Деталей в сцене')}: {fmt(hud.parts)}</span>
      <span>GPU: {fmtSize(hud.bytes)}</span>
      <span>{t('Кэш')}: {fmt(hud.entries)} {t('зап.')}</span>
    </div>
  );
}
