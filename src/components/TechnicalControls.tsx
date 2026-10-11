import { t, useLocale } from '../core/i18n';
import { memo } from 'react';
import { useEngineStore } from '../core/store';
import { detailLevels } from '../data/parts/detail';
import { cycleAngle, firingOrder } from '../data/engine/kinematics';

/** Отладочный вывод читает угол коленвала, который меняется 60 раз в секунду.
 *  Он изолирован в отдельном листе, чтобы не перерисовывать весь блок настроек. */
const DebugReadout = memo(function DebugReadout(){
 useLocale();
 const angle=useEngineStore(s=>s.crankAngle);const cylinder=useEngineStore(s=>s.cylinder);const set=useEngineStore(s=>s.set);
 const cycle=cycleAngle(angle,cylinder??1);
 const stroke=[t("Рабочий ход"),t("Выпуск"),t("Впуск"),t("Сжатие")][Math.floor(cycle/180)];
 return <div className="debug-readout"><b>θ {(angle%720).toFixed(1)}° · {t("Распредвал")} {((angle/2)%360).toFixed(1)}°</b><span>{t("Цилиндр")}{cylinder??1} · {stroke}</span><span>{cycle%360<1?t("ВМТ"):Math.abs(cycle%360-180)<1?t("НМТ"):t("Между мёртвыми точками")}</span><span>{t("Порядок зажигания:")}{firingOrder[Math.floor(angle%720/90)]}</span><label>{t("Угол коленвала")}<input aria-label={t("Угол коленвала")} type="range" min={0} max={720} step={1} value={angle%720} onChange={e=>set({crankAngle:Number(e.target.value),running:false})}/></label><small>{t("Фазы клапанов идеализированы. Метки — учебные.")}</small></div>;
});

export const TechnicalControls = memo(function TechnicalControls(){
 useLocale();
 const detailLevel=useEngineStore(s=>s.detailLevel);
 const renderQuality=useEngineStore(s=>s.renderQuality);
 const debug=useEngineStore(s=>s.debug);
 const slowMotion=useEngineStore(s=>s.slowMotion);
 const set=useEngineStore(s=>s.set);
 return <details className="technical-controls glass"><summary>{t("Технические настройки ·")} {detailLevel}%</summary>
 <label>{t("Детализация")}<b>{detailLevel}%</b><input aria-label={t("Техническая детализация")} type="range" min={0} max={8} step={1} value={detailLevels.indexOf(detailLevel as typeof detailLevels[number])} onChange={e=>set({detailLevel:detailLevels[Number(e.target.value)]})}/></label>
 <p>{t("Количество компонентов; геометрия approximate")}</p>
 <label>{t("Качество рендера")}<select aria-label={t("Качество рендера")} value={renderQuality} onChange={e=>set({renderQuality:e.target.value as 'low'|'high'})}><option value="low">{t("Экономное")}</option><option value="high">{t("Высокое")}</option></select></label>
 <label><input type="checkbox" checked={debug} onChange={e=>set({debug:e.target.checked})}/>{t("Механическая отладка: оси и центры")}</label>
 <label><input type="checkbox" checked={slowMotion} onChange={e=>set({slowMotion:e.target.checked})}/>{t("Замедление 0.05×")}</label>
 <button onClick={()=>set({crankAngle:0,running:false})}>{t("ВМТ №1 · 0°")}</button>
 {debug&&<DebugReadout/>}
 </details>;
});
