import { t, useLocale } from '../core/i18n';
import { Eye, EyeOff, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { engine2uz } from '../engines/2uz-fe';
import { useEngineStore } from '../core/store';
import type { SystemId } from '../core/types';

export const SystemsPanel = memo(function SystemsPanel() {
 useLocale();
  const systems = useEngineStore((s) => s.systems);
  const toggle = useEngineStore((s) => s.toggleSystem);
  const open = useEngineStore((s) => s.systemsOpen);
  const set = useEngineStore((s) => s.set);
  const detail=useEngineStore(s=>s.detailLevel);
  // Каталог — это 392 кнопки. Раньше они попадали в дерево React даже при закрытом
  // <details>. Теперь содержимое монтируется только для раскрытых разделов.
  const [catalogOpen,setCatalogOpen]=useState(false);
  const [openSystems,setOpenSystems]=useState<ReadonlySet<SystemId>>(()=>new Set());
  const setSystemOpen=useCallback((id:SystemId,isOpen:boolean)=>setOpenSystems((current)=>{
   const next=new Set(current);
   if(isOpen)next.add(id);else next.delete(id);
   return next;
  }),[]);
  const available=engine2uz.parts.filter(p=>p.minimumDetailLevel<=detail);
  const counts = available.reduce<Record<string,number>>((acc,p)=>({...acc,[p.system]:(acc[p.system]??0)+1}),{});
  const visible = available.filter((p) => systems[p.system]).length;
  const setAll = (value:boolean) => set({systems:Object.fromEntries(engine2uz.systems.map((s)=>[s.id,value])) as Record<SystemId,boolean>});
  return <>
    {open && <button className="drawer-backdrop" aria-label={t("Закрыть панель")} onClick={() => set({systemsOpen:false})}/>} 
    <aside className={`systems-panel glass ${open?'open':''}`} aria-label={t("Системы двигателя")}>
      <div className="panel-title"><div><span>{t("Системы")}</span><b>{engine2uz.systems.length}</b></div><button onClick={()=>set({systemsOpen:false})} className="mobile-close" aria-label={t("Закрыть")}><X size={18}/></button></div>
      <div className="systems-tabs"><button onClick={()=>setAll(true)}>{t("Все")}</button><button onClick={()=>setAll(false)}>{t("Скрыть")}</button><button onClick={()=>set({systems:{...systems,engine:true,cranktrain:true,heads:true,valvetrain:true}})}>{t("Механика")}</button></div>
      <div className="systems-list">
        {engine2uz.systems.map((system)=><div className={`system-row ${systems[system.id]?'active':''}`} key={system.id}>
          <button className="system-name" onClick={() => set({systems:Object.fromEntries(engine2uz.systems.map((s)=>[s.id,s.id===system.id])) as Record<SystemId,boolean>})} title={t("Показать только: {0}", [system.nameRu])}>
            <i style={{background:system.color}}/><span>{t(system.nameRu)}<small>{system.name}</small></span><b>{counts[system.id]}</b>
          </button>
          <button className="system-toggle" role="switch" aria-checked={systems[system.id]} aria-label={t("{0} {1}", [systems[system.id]?'Скрыть':'Показать',system.nameRu])} onClick={()=>toggle(system.id)}>{systems[system.id]?<Eye size={15}/>:<EyeOff size={15}/>}</button>
        </div>)}
      </div>
      <details className="parts-tree" onToggle={(e)=>setCatalogOpen(e.currentTarget.open)}><summary>{t('Каталог деталей')}</summary>{catalogOpen&&engine2uz.systems.map(system=><details key={system.id} onToggle={(e)=>setSystemOpen(system.id,e.currentTarget.open)}><summary>{t(system.nameRu)}</summary>{openSystems.has(system.id)&&available.filter(p=>p.system===system.id).map(p=><button key={p.id} onClick={()=>useEngineStore.getState().focus(p.id)}><small>{t(engine2uz.parts.find(parent=>parent.id===p.parent)?.nameRu??'Двигатель')}</small>{t(p.nameRu)}</button>)}</details>)}</details>
      <footer><span><b>{visible}</b> {t("компонентов видно")}</span><button onClick={()=>setAll(visible===0)}>{visible===0?t("Показать все"):t("Скрыть все")}</button></footer>
    </aside>
  </>;
});
