import { t, useLocale } from '../core/i18n';
import { ExternalLink, X } from 'lucide-react';
import { memo } from 'react';
import { useEngineStore } from '../core/store';
import { engine2uz } from '../engines/2uz-fe';
import { sources } from '../engines/2uz-fe/specifications';

export const ModalPanels = memo(function ModalPanels(){
 useLocale();
 const specs=useEngineStore(s=>s.specsOpen);const shortcuts=useEngineStore(s=>s.shortcutsOpen);const set=useEngineStore(s=>s.set);
 if(!specs&&!shortcuts)return null;
 return <div className="modal-layer" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)set({specsOpen:false,shortcutsOpen:false})}}><div className="info-modal glass"><button aria-label={t("Закрыть")} className="panel-x" onClick={()=>set({specsOpen:false,shortcutsOpen:false})}><X size={19}/></button>{shortcuts?<><div className="modal-eyebrow">{t("Управление")}</div><h2>{t("Горячие клавиши")}</h2><div className="shortcut-grid">{[['F',t("Фокус")],['H',t("Скрыть деталь")],['I',t("Изолировать")],['X','X‑Ray'],['E',t("Разнести")],['R',t("Сброс")],[t("Пробел"),t("Пуск / пауза")],['Esc',t("Снять выделение")],['/',t("Поиск")]].map(([key,label])=><div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}</div></>:<><div className="modal-eyebrow">{t("Engine specs")}</div><h2>{t("2UZ‑FE · Tundra 2003 · без VVT‑i")}</h2><p className="modal-lead">{t("Данные конкретной версии отделены от более поздних вариантов VVT‑i. Мощность и степень сжатия здесь намеренно не указаны: они зависят от года, рынка и стандарта измерения.")}</p><div className="spec-grid">{engine2uz.specifications.map(s=><div key={t(s.label)}><span>{t(s.label)}</span><b>{t(s.value)}</b></div>)}</div><h3>{t("Источники")}</h3><div className="source-list">{sources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.id}><span><b>{t(s.title)}</b><small>{t(s.note)}</small></span><ExternalLink size={15}/></a>)}</div><div className="accuracy-note"><b>{t("Область точности")}</b><span>{t(engine2uz.model.note)}</span></div></>}</div></div>
});
