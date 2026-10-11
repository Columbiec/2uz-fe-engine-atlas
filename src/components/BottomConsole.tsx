import { t, useLocale } from '../core/i18n';
import { ChevronLeft, ChevronRight, Flame, Gauge, Layers3, Pause, Play, RotateCcw, Wrench } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useEngineStore } from '../core/store';
import { engine2uz } from '../engines/2uz-fe';

const ExplodeControl = memo(function ExplodeControl(){
 useLocale();
 const explode=useEngineStore(s=>s.explode);const set=useEngineStore(s=>s.set);
 return <div className="explode-control"><div className="control-heading"><span><Layers3 size={16}/>{t("Разнести двигатель")}</span><b>{Math.round(explode)}%</b></div><input aria-label={t("Разнести двигатель")} type="range" min="0" max="100" value={explode} onChange={e=>set({explode:Number(e.target.value),disassemblyStep:-1})}/><div className="range-labels"><span>{t("Собран")}</span><span>{t("Все детали")}</span></div></div>;
});

/** Полоса порядка зажигания зависит от угла коленвала, то есть обновляется каждый
 *  кадр. Держим её отдельным листом, чтобы кнопка пуска и ползунок RPM не
 *  перерисовывались вместе с ней. */
const FiringStrip = memo(function FiringStrip(){
 useLocale();
 const angle=useEngineStore(s=>s.crankAngle);const firing=useEngineStore(s=>s.firing);const cylinder=useEngineStore(s=>s.cylinder);const set=useEngineStore(s=>s.set);
 const firingCylinder=engine2uz.firingOrder[Math.floor((angle%720)/90)%8];
 const stroke=(c:number)=>{const pos=((angle-engine2uz.firingOrder.indexOf(c)*90+720)%720);return pos<180?t("РАБОЧИЙ ХОД"):pos<360?t("ВЫПУСК"):pos<540?t("ВПУСК"):t("СЖАТИЕ")};
 return <div className="firing-order">{engine2uz.firingOrder.map((c)=><button key={c} className={(firing&&firingCylinder===c)||cylinder===c?'hot':''} onClick={()=>set({cylinder:c,selected:`piston-${c}`,infoOpen:true,cameraRequest:useEngineStore.getState().cameraRequest+1,cameraPreset:null,navigation:'transition'})}>{c}<small>{firing&&firingCylinder===c?stroke(c):''}</small></button>)}</div>;
});

const EngineControl = memo(function EngineControl(){
 useLocale();
 const running=useEngineStore(s=>s.running);const rpm=useEngineStore(s=>s.rpm);const firing=useEngineStore(s=>s.firing);const set=useEngineStore(s=>s.set);
 return <div className="engine-control">
  <button className={`engine-start ${running?'running':''}`} onClick={()=>set({running:!running})}>{running?<Pause size={17}/>:<Play size={17}/>}<span>{running?t("Остановить"):t("Запустить двигатель")}</span></button>
  <label><Gauge size={16}/><span>RPM</span><input type="range" min="60" max="6000" step="60" value={rpm} onChange={e=>set({rpm:Number(e.target.value)})}/><b>{rpm}</b></label>
  <button className={firing?'active':''} onClick={()=>set({firing:!firing,running:true})}><Flame size={16}/>{t("Порядок зажигания")}</button>
  <FiringStrip/>
 </div>;
});

const DisassemblyControl = memo(function DisassemblyControl(){
 useLocale();
 const step=useEngineStore(s=>s.disassemblyStep);const auto=useEngineStore(s=>s.autoDisassembly);const set=useEngineStore(s=>s.set);const current=engine2uz.disassembly[Math.max(step,0)];
 useEffect(()=>{if(!auto)return;const timer=window.setInterval(()=>{const s=useEngineStore.getState();if(s.disassemblyStep>=engine2uz.disassembly.length-1)set({autoDisassembly:false});else set({disassemblyStep:s.disassemblyStep+1})},1800);return()=>clearInterval(timer)},[auto,set]);
 return <div className="disassembly-control">
  <div className="step-count">{step<0?t("Готов к разборке"):t("Шаг {0} / {1}", [step+1,engine2uz.disassembly.length])}</div>
  <div className="step-copy"><b>{step<0?t("Интерактивная последовательность"):t(current.title)}</b><span>{step<0?t("Сокращённая учебная последовательность; сверяйтесь с документацией своей модификации."):t(current.description)}</span></div>
  <div className="step-actions"><button aria-label={t("Предыдущий шаг")} disabled={step<0} onClick={()=>set({disassemblyStep:step-1})}><ChevronLeft size={17}/></button><button className="autoplay" onClick={()=>step<0?set({disassemblyStep:0}):set({autoDisassembly:!auto})}>{step<0?<><Wrench size={15}/>{t("Начать")}</>:auto?<><Pause size={15}/>{t("Пауза")}</>:<><Play size={15}/>{t("Авто")}</>}</button><button aria-label={t("Следующий шаг")} disabled={step>=engine2uz.disassembly.length-1} onClick={()=>set({disassemblyStep:step+1})}><ChevronRight size={17}/></button><button aria-label={t("Сбросить разборку")} onClick={()=>set({disassemblyStep:-1,autoDisassembly:false})}><RotateCcw size={16}/></button></div>
 </div>;
});

export const BottomConsole = memo(function BottomConsole(){
 useLocale();
 const workspace=useEngineStore(s=>s.workspace);const set=useEngineStore(s=>s.set);
 return <div className="bottom-wrap">
  <div className="mode-tabs glass" role="tablist">{([['explore','Обзор'],['disassembly','Разборка'],['learn','Обучение'],['quiz','Тест']] as const).map(([id,label])=><button key={id} className={workspace===id?'active':''} onClick={()=>set(id==='disassembly'?{workspace:id,disassemblyStep:-1}:id==='quiz'?{workspace:id,quizResult:'idle'}:{workspace:id})}>{t(label)}</button>)}</div>
  <div className="bottom-console glass">{workspace==='disassembly'?<DisassemblyControl/>:<><ExplodeControl/><EngineControl/></>}</div>
 </div>;
});
