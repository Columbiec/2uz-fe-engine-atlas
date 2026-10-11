import { t, useLocale } from '../core/i18n';
import { Search, X } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { engine2uz } from '../engines/2uz-fe';
import { searchParts } from '../core/search';
import { useEngineStore } from '../core/store';

export const SearchDialog = memo(function SearchDialog() {
 useLocale();
  const open = useEngineStore((s)=>s.searchOpen);
  const set = useEngineStore((s)=>s.set);
  const focus = useEngineStore((s)=>s.focus);
  const [query,setQuery]=useState('');
  const input=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(open){setQuery('');requestAnimationFrame(()=>input.current?.focus())}},[open]);
  if(!open)return null;
  const results=searchParts(engine2uz.parts,query).slice(0,12);
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label={t("Поиск деталей")} onMouseDown={(e)=>{if(e.target===e.currentTarget)set({searchOpen:false})}}>
    <div className="search-dialog glass">
      <div className="search-input"><Search size={20}/><input ref={input} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={t("Поршень, crankshaft, датчик коленвала…")} aria-label={t("Поиск")}/><button aria-label={t("Закрыть")} onClick={()=>set({searchOpen:false})}><X size={19}/></button></div>
      <div className="search-hint">{t("Поиск по русскому и английскому названию, ID, системе и назначению")}</div>
      <div className="search-results">
        {results.map((part)=><button key={part.id} onClick={()=>{focus(part.id);set({searchOpen:false})}}>
          <i style={{background:engine2uz.systems.find(s=>s.id===part.system)?.color}}/><span><b>{t(part.nameRu)}</b><small>{part.name} · {part.id}</small></span><em>{t(engine2uz.systems.find(s=>s.id===part.system)?.nameRu)}</em>
        </button>)}
        {!results.length&&<div className="empty">{t("Ничего не найдено. Попробуйте название системы или номер цилиндра.")}</div>}
      </div>
    </div>
  </div>;
});
