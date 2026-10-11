import type { EnginePart, SystemId, ViewMode } from '../../core/types';

/**
 * Правила видимости, прозрачности и цветов деталей.
 *
 * Вынесено из компонента, чтобы одинаковые правила применяли и сцена, и генератор
 * QA-отчёта: иначе числа в отчёте и в рантайме разъедутся.
 */

export const METAL_COLOR = '#a8afb7';
export const SYSTEM_COLORS: Record<string, string> = { cranktrain: METAL_COLOR, heads: METAL_COLOR, engine: METAL_COLOR, valvetrain: '#a88ac3', timing: '#d89b54', intake: '#57a4b5', fuel: '#74a96f', ignition: '#e0b451', lubrication: '#c79249', cooling: '#4a91cf', exhaust: '#b96d5f', sensors: '#69a18c', accessories: '#77869c', fasteners: '#70757e' };
export const RING_COLOR = '#59616b';
export const GROOVE_COLOR = '#343a41';
export const SELECTED_COLOR = '#ff5e4d';
export const HOVERED_COLOR = '#ffd5ce';

/** Полное состояние сцены — то, что лежит в сторе. */
export interface SceneState {
  viewMode: ViewMode;
  isolated: string | null;
  hidden: ReadonlySet<string>;
  transparent: ReadonlySet<string>;
  systems: Readonly<Partial<Record<SystemId, boolean>>>;
}

/** Состояние сцены по умолчанию: все системы включены, ничего не скрыто. */
export function defaultSceneState(systems: Partial<Record<SystemId, boolean>> = {}): SceneState {
  return { viewMode: 'normal', isolated: null, hidden: new Set(), transparent: new Set(), systems };
}

/** Флаги, посчитанные для конкретной детали. Компонент подписывается на свою часть
 *  состояния точечно, поэтому ему не нужны множества целиком. */
export interface PartFlags {
  viewMode: ViewMode;
  isolated: string | null;
  hidden: boolean;
  transparent: boolean;
  systemEnabled: boolean;
}

export function partFlags(part: EnginePart, scene: SceneState): PartFlags {
  return {
    viewMode: scene.viewMode,
    isolated: scene.isolated,
    hidden: scene.hidden.has(part.id),
    transparent: scene.transparent.has(part.id),
    systemEnabled: !!scene.systems[part.system],
  };
}

export function partOpacity(part: EnginePart, flags: PartFlags): number {
  if (flags.viewMode === 'xray') return .22;
  if ((flags.viewMode === 'transparent' && part.housing) || flags.transparent) return .16;
  if (flags.isolated && flags.isolated !== part.id) return .06;
  return .88;
}

export function partVisible(part: EnginePart, flags: PartFlags): boolean {
  return part.visibility
    && flags.systemEnabled
    && !flags.hidden
    && !(flags.viewMode === 'cutaway' && part.housing && part.position[0] > 0.05);
}
