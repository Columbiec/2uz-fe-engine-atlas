import { t, useLocale } from './core/i18n';
import { TechnicalControls } from './components/TechnicalControls';
import { useEffect, memo } from 'react';
import { EngineViewer } from './viewer/EngineViewer';
import { Header } from './components/Header';
import { SystemsPanel } from './components/SystemsPanel';
import { SearchDialog } from './components/SearchDialog';
import { PartPanel } from './components/PartPanel';
import { ViewportControls } from './components/ViewportControls';
import { BottomConsole } from './components/BottomConsole';
import { LearnPanel } from './components/LearnPanel';
import { ModalPanels } from './components/ModalPanels';
import { useEngineStore } from './core/store';
import { engine2uz } from './engines/2uz-fe';
import { Activity } from 'lucide-react';
import type { FlowMode } from './core/types';

const FLOW_LABEL_KEYS: Record<Exclude<FlowMode, 'none'>, string> = {
  oil: 'ПОТОК МАСЛА', coolant: 'ПОТОК ОЖ', air: 'ВОЗДУШНЫЙ ПОТОК', fuel: 'ТОПЛИВО',
};

/** Угол коленвала меняется каждый кадр. Подписку на него держит только этот лист,
 *  иначе вся шапка/консоль перерисовывались бы 60 раз в секунду. */
const LiveAngle = memo(function LiveAngle() {
  useLocale();
  const angle = useEngineStore((s) => s.crankAngle);
  return <span>{t("УГОЛ КОЛЕНВАЛА {0}°", [Math.round(angle)])}</span>;
});

const LiveBadge = memo(function LiveBadge() {
  useLocale();
  const flow = useEngineStore((s) => s.flow);
  const firing = useEngineStore((s) => s.firing);
  const flowLabel = flow === 'none' ? null : t(FLOW_LABEL_KEYS[flow]);
  if (!flowLabel && !firing) return null;
  return <div className="live-badge"><Activity size={15} />{flowLabel ? <span>{flowLabel}</span> : <LiveAngle />}</div>;
});

/** Курсор — производное от hovered, а не побочный эффект обработчиков меша.
 *  Деталь может исчезнуть из сцены прямо под курсором (смена тира, скрытие,
 *  изоляция), и тогда onPointerOut уже не сработает. */
const CursorSync = memo(function CursorSync() {
  const hovered = useEngineStore((s) => s.hovered);
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => { document.body.style.cursor = ''; };
  }, [hovered]);
  return null;
});

function useKeyboard(){
 const set=useEngineStore(s=>s.set);const focus=useEngineStore(s=>s.focus);const toggleHidden=useEngineStore(s=>s.toggleHidden);const reset=useEngineStore(s=>s.reset);const select=useEngineStore(s=>s.select);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.target as HTMLElement)?.matches('input,textarea'))return;const state=useEngineStore.getState();if(event.key==='/'){event.preventDefault();set({searchOpen:true})}else if(event.key==='Escape')select(null);else if(event.key.toLowerCase()==='f'&&state.selected)focus();else if(event.key.toLowerCase()==='h'&&state.selected)toggleHidden(state.selected);else if(event.key.toLowerCase()==='i'&&state.selected)set({isolated:state.isolated?null:state.selected});else if(event.key.toLowerCase()==='x')set({viewMode:state.viewMode==='xray'?'normal':'xray'});else if(event.key.toLowerCase()==='e')set({explode:state.explode?0:100});else if(event.key.toLowerCase()==='r')reset();else if(event.code==='Space'){event.preventDefault();set({running:!state.running})}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[focus,reset,select,set,toggleHidden]);
}

export default function App(){
 useLocale();
 const set=useEngineStore(s=>s.set);
 useKeyboard();
 useEffect(()=>{const id=new URLSearchParams(location.search).get('part');if(id&&engine2uz.parts.some(p=>p.id===id))set({selected:id,infoOpen:true,cameraRequest:1})},[set]);
 return <main className="app-shell">
  <EngineViewer/>
  <Header/><TechnicalControls/><SystemsPanel/><PartPanel/><ViewportControls/><BottomConsole/><LearnPanel/><SearchDialog/><ModalPanels/>
  <div className="model-label"><span>2UZ‑FE / 001</span><b>90° V8 · 4.7 L</b></div>
  <LiveBadge/>
  <div className="interaction-hint">{t("Мышь: вращать · Колесо: масштаб · Клик: выбрать деталь")}</div>
  <div className="webgl-fallback">{t("Для интерактивной модели необходим браузер с поддержкой WebGL 2.")}</div>
  <CursorSync/>
 </main>;
}
