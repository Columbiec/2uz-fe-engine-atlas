import { t, useLocale } from '../core/i18n';
import { BookOpen, Check, ChevronRight, CircleHelp, X } from 'lucide-react';
import { engine2uz } from '../engines/2uz-fe';
import { memo } from 'react';
import { quizItems, useEngineStore } from '../core/store';
import type { SystemId } from '../core/types';

export const LearnPanel = memo(function LearnPanel(){
 useLocale();
 const workspace=useEngineStore(s=>s.workspace);const lesson=useEngineStore(s=>s.lesson);const quizIndex=useEngineStore(s=>s.quizIndex);const quizResult=useEngineStore(s=>s.quizResult);const set=useEngineStore(s=>s.set);const focus=useEngineStore(s=>s.focus);
 if(workspace!=='learn'&&workspace!=='quiz')return null;
 if(workspace==='quiz'){
  const q=quizItems[quizIndex];return <aside className="learn-panel glass quiz-panel"><button aria-label={t("Закрыть")} className="panel-x" onClick={()=>set({workspace:'explore'})}><X size={18}/></button><div className="lesson-label"><CircleHelp size={16}/>{t("Интерактивный тест ·")}{quizIndex+1}/{quizItems.length}</div><h2>{t(q.question)}</h2><p>{t("Нажмите нужную деталь непосредственно на 3D-модели.")}</p><div className={`quiz-feedback ${quizResult}`}>{quizResult==='correct'?<><Check size={18}/>{t("Верно")}</>:quizResult==='wrong'?t("Попробуйте ещё раз"):t("Подсказка: {0}", [q.hint])}</div>{quizResult==='correct'&&<button className="primary" onClick={()=>set({quizIndex:(quizIndex+1)%quizItems.length,quizResult:'idle',selected:null,infoOpen:false})}>{t("Следующий вопрос")}<ChevronRight size={17}/></button>}</aside>
 }
 const active=engine2uz.lessons.find(l=>l.id===lesson);
 const start=(id:string)=>{const l=engine2uz.lessons.find(x=>x.id===id)!;const vis=Object.fromEntries(engine2uz.systems.map(s=>[s.id,l.systems.includes(s.id as SystemId)])) as Record<SystemId,boolean>;set({lesson:id,systems:vis,running:!!l.running,flow:l.flow??'none',related:!!l.related,viewMode:l.flow?'transparent':'normal'});focus(l.part)};
 return <aside className="learn-panel glass"><button aria-label={t("Закрыть")} className="panel-x" onClick={()=>set({workspace:'explore',lesson:null,flow:'none'})}><X size={18}/></button><div className="lesson-label"><BookOpen size={16}/>{t("Обучение на модели")}</div>{active?<><div className="lesson-index">{t("Урок")}{engine2uz.lessons.indexOf(active)+1} / {engine2uz.lessons.length}</div><h2>{t(active.title)}</h2><b className="lesson-subtitle">{t(active.subtitle)}</b><p>{t(active.text)}</p><button className="primary" onClick={()=>set({lesson:null,flow:'none'})}>{t("К списку уроков")}</button></>:<><h2>{t("Изучите двигатель в действии")}</h2><p>{t("Каждый урок настраивает камеру, системы и анимацию прямо на 3D-модели.")}</p><div className="lesson-list">{engine2uz.lessons.map((l,i)=><button key={l.id} onClick={()=>start(l.id)}><b>{String(i+1).padStart(2,'0')}</b><span>{t(l.title)}<small>{t(l.subtitle)}</small></span><ChevronRight size={16}/></button>)}</div></>}</aside>
});
