import { t, useLocale } from '../core/i18n';
import { Camera, Maximize, RotateCcw, ScanLine } from 'lucide-react';
import { memo } from 'react';
import { useEngineStore } from '../core/store';
import type { CameraPreset, ViewMode } from '../core/types';
import { IconButton } from './IconButton';

const presets:[CameraPreset,string][]=[['iso','3/4'],['front','F'],['back','B'],['left','L'],['right','R'],['top','T'],['bottom','D'],['bank1','B1'],['bank2','B2']];
const viewModes:[ViewMode,string][]=[['normal','Обычный'],['transparent','Прозрачный'],['xray','X‑Ray'],['cutaway','Разрез']];

export const ViewportControls = memo(function ViewportControls(){
 useLocale();
 const preset=useEngineStore(s=>s.cameraPreset);const viewMode=useEngineStore(s=>s.viewMode);const set=useEngineStore(s=>s.set);const reset=useEngineStore(s=>s.reset);
 // Снимок делает контроллер внутри Canvas: без preserveDrawingBuffer читать пиксели
 // можно только в кадре рендера, поэтому здесь мы лишь ставим запрос.
 const requestScreenshot=()=>set({screenshotRequest:useEngineStore.getState().screenshotRequest+1});
 return <>
  <div className="camera-controls glass" aria-label={t("Ракурсы камеры")}>{presets.map(([id,label])=><button key={id} className={preset===id?'active':''} onClick={()=>set({cameraPreset:id,navigation:'transition',cameraRequest:useEngineStore.getState().cameraRequest+1})} title={id}>{t(label)}</button>)}<span/><IconButton label={t("Сбросить сцену")} onClick={reset}><RotateCcw size={17}/></IconButton></div>
  <div className="view-controls glass"><ScanLine size={16}/>{viewModes.map(([id,label])=><button key={id} className={viewMode===id?'active':''} onClick={()=>set({viewMode:id})}>{t(label)}</button>)}</div>
  <div className="corner-actions"><IconButton label={t("Снимок экрана")} onClick={requestScreenshot}><Camera size={17}/></IconButton><IconButton label={t("Полный экран")} onClick={()=>document.documentElement.requestFullscreen?.()}><Maximize size={17}/></IconButton></div>
 </>;
});

