import { create } from 'zustand';
import type { CameraPreset, FlowMode, SystemId, ViewMode, Workspace } from './types';
import { engine2uz } from '../engines/2uz-fe';

type State = {
  selected: string | null; hovered: string | null; hidden: Set<string>; isolated: string | null;
  transparent: Set<string>; systems: Record<SystemId, boolean>; explode: number; running: boolean;
  rpm: number; crankAngle: number; cylinder: number | null; firing: boolean; slowMotion: boolean;
  viewMode: ViewMode; flow: FlowMode; workspace: Workspace; disassemblyStep: number;
  autoDisassembly: boolean; related: boolean; cameraPreset: CameraPreset | null; navigation: 'preset' | 'manual' | 'transition'; detailLevel: number; debug: boolean; renderQuality: 'low'|'high'; cameraRequest: number;
  /** Счётчик запросов на снимок экрана. Снимок делается внутри кадра рендера,
   *  поэтому контекст не обязан держать preserveDrawingBuffer. */
  screenshotRequest: number;
  lesson: string | null; quizIndex: number; quizResult: 'idle' | 'correct' | 'wrong';
  searchOpen: boolean; infoOpen: boolean; systemsOpen: boolean; shortcutsOpen: boolean; specsOpen: boolean;
  set: (patch: Partial<Omit<State, 'set' | 'reset' | 'select' | 'toggleSystem' | 'toggleHidden' | 'focus'>>) => void;
  select: (id: string | null) => void; toggleSystem: (id: SystemId) => void; toggleHidden: (id: string) => void;
  focus: (id?: string) => void; reset: () => void;
};

const allSystems = Object.fromEntries(engine2uz.systems.map((s) => [s.id, true])) as Record<SystemId, boolean>;
const initial = { selected: null, hovered: null, hidden: new Set<string>(), isolated: null, transparent: new Set<string>(), systems: allSystems, explode: 0, running: false, rpm: 60, crankAngle: 0, cylinder: null, firing: false, slowMotion: false, viewMode: 'transparent' as ViewMode, flow: 'none' as FlowMode, workspace: 'explore' as Workspace, disassemblyStep: -1, autoDisassembly: false, related: false, cameraPreset: 'iso' as CameraPreset, navigation: 'preset' as const, detailLevel: 500, debug: false, renderQuality: 'high' as const, cameraRequest: 0, screenshotRequest: 0, lesson: null, quizIndex: 0, quizResult: 'idle' as const, searchOpen: false, infoOpen: false, systemsOpen: false, shortcutsOpen: false, specsOpen: false };

export const useEngineStore = create<State>((set, get) => ({
  ...initial,
  set: (patch) => set(patch),
  select: (id) => {
    set({ selected: id, infoOpen: !!id, quizResult: get().workspace === 'quiz' ? (id === quizItems[get().quizIndex].target ? 'correct' : 'wrong') : 'idle' });
    if (id) history.replaceState(null, '', `${location.pathname}?part=${encodeURIComponent(id)}`); else history.replaceState(null, '', location.pathname);
  },
  toggleSystem: (id) => set((s) => ({ systems: { ...s.systems, [id]: !s.systems[id] } })),
  toggleHidden: (id) => set((s) => { const hidden = new Set(s.hidden); if (hidden.has(id)) hidden.delete(id); else hidden.add(id); return { hidden }; }),
  focus: (id) => {
    const selected = id ?? get().selected;
    if (selected) history.replaceState(null, '', `${location.pathname}?part=${encodeURIComponent(selected)}`);
    set((s) => ({ selected, infoOpen: true, cameraPreset: null, navigation: 'transition', detailLevel: Math.max(get().detailLevel, engine2uz.parts.find(p=>p.id===selected)?.minimumDetailLevel ?? 10), cameraRequest: s.cameraRequest + 1 }));
  },
  reset: () => { history.replaceState(null, '', location.pathname); set({ ...initial, hidden: new Set(), transparent: new Set(), systems: { ...allSystems }, cameraRequest: get().cameraRequest + 1 }); },
}));

export const quizItems = [
  { question: 'Найдите масляный насос', target: 'oil-pump', hint: 'Передняя нижняя часть блока' },
  { question: 'Выберите коленчатый вал', target: 'crankshaft', hint: 'Главный вращающийся вал в нижней части' },
  { question: 'Найдите датчик положения коленвала', target: 'crank-sensor', hint: 'Рядом с передним шкивом' },
  { question: 'Выберите поршень первого цилиндра', target: 'piston-1', hint: 'Ряд 1, ближе к передней части' },
];
