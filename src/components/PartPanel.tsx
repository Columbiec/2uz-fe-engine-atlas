import { t, useLocale } from '../core/i18n';
import { sources } from '../engines/2uz-fe/specifications';
import { Box, Copy, EyeOff, Focus, Link2, ScanLine, Sparkles, X } from 'lucide-react';
import { memo } from 'react';
import { useEngineStore } from '../core/store';
import { engine2uz } from '../engines/2uz-fe';

export const PartPanel = memo(function PartPanel() {
 useLocale();
  const selected = useEngineStore((s)=>s.selected);
  const infoOpen = useEngineStore((s)=>s.infoOpen);
  const isolated = useEngineStore((s)=>s.isolated);
  const transparent = useEngineStore((s)=>s.transparent);
  const related = useEngineStore((s)=>s.related);
  const set = useEngineStore((s)=>s.set);
  const select = useEngineStore((s)=>s.select);
  const focus = useEngineStore((s)=>s.focus);
  const toggleHidden = useEngineStore((s)=>s.toggleHidden);
  const part=engine2uz.parts.find(p=>p.id===selected);
  if(!part||!infoOpen)return null;
  const system=engine2uz.systems.find(s=>s.id===part.system)!;
  const toggleTransparent=()=>{const next=new Set(transparent);if(next.has(part.id))next.delete(part.id);else next.add(part.id);set({transparent:next})};
  return <aside className="part-panel glass" aria-label={t("Информация: {0}", [part.nameRu])}>
    <div className="part-accent" style={{background:system.color}}/>
    <button className="panel-x" onClick={()=>select(null)} aria-label={t("Закрыть")}><X size={19}/></button>
    <div className="part-system">{t(system.nameRu)} · {part.id}</div>
    <h2>{t(part.nameRu)}</h2><div className="part-en">{part.name}</div>
    <p>{t(part.description)}</p>
    <section><h3>{t("Назначение и работа")}</h3><p>{t(part.function)}</p></section>
    <div className="facts"><div><span>{t("Материал")}</span><b>{t(part.material)}</b></div>{part.cylinder&&<div><span>{t("Цилиндр / ряд")}</span><b>№ {part.cylinder} {t("· ряд")}{part.bank}</b></div>}<div><span>{t("Точность")}</span><b>{t("Учебная геометрия")}</b></div></div>
    <section className="failure"><h3>{t("Типичные проблемы")}</h3><p>{part.failures.map(v=>t(v)).join(' · ')}</p><small>{t("Признаки:")}{part.failureSymptoms.map(v=>t(v)).join(', ')}.</small></section>
    <section><h3>{t("Технические примечания")}</h3>{part.technicalNotes.map((note)=><p className="note" key={note}>{t(note)}</p>)}</section>
    <section><h3>{t("Документация и положение")}</h3><p>{t(part.confidence)} · {part.minimumDetailLevel}%</p><p>{part.assembly} → {part.id}</p><p>XYZ: {part.position.map(n=>n.toFixed(3)).join(' / ')} · approximate</p><p>{t("Ось:")}{part.rotationAxis?.join(' / ')??t("Нет постоянной оси вращения")}</p>{part.documentationSource.map(source=><p key={source.id}><a href={sources.find(s=>s.id===source.id)?.url} target="_blank" rel="noreferrer">{source.id} · {source.section}</a></p>)}</section>
    <div className="part-actions">
      <button className={isolated===part.id?'active':''} onClick={()=>set({isolated:isolated===part.id?null:part.id})}><Box size={15}/>{t("Изолировать")}</button>
      <button onClick={()=>toggleHidden(part.id)}><EyeOff size={15}/>{t("Скрыть")}</button>
      <button className={transparent.has(part.id)?'active':''} onClick={toggleTransparent}><ScanLine size={15}/>{t("Прозрачность")}</button>
      <button onClick={()=>focus()}><Focus size={15}/>{t("Фокус")}</button>
      <button onClick={()=>set({explode:100})}><Sparkles size={15}/>{t("Разнести")}</button>
      <button className={related?'active':''} onClick={()=>set({related:!related})}><Link2 size={15}/>{t("Связи")}</button>
      <button onClick={()=>navigator.clipboard?.writeText(location.href)}><Copy size={15}/>{t("Ссылка")}</button>
    </div>
    {!!part.relatedParts.length&&<section className="related-list"><h3>{t("Связанные детали")}</h3><div>{part.relatedParts.map(id=>engine2uz.parts.find(p=>p.id===id)).filter(Boolean).slice(0,7).map(p=><button key={p!.id} onClick={()=>focus(p!.id)}>{t(p!.nameRu)}</button>)}</div></section>}
  </aside>;
});
