import { createInitialState, type GameState } from '../state';

export const REBOOT_PREVIEW_THRESHOLD = 100_000_000;
export const REBOOT_THRESHOLD = 1_000_000_000;

export function rebootCoreGain(state: GameState): number {
  return Math.floor(Math.sqrt(state.totalClips / REBOOT_THRESHOLD));
}

export function rebootMultiplier(state: GameState): number {
  return 1 + state.optimizationCores * 0.25;
}

export function canReboot(state: GameState): boolean {
  return state.totalClips >= REBOOT_THRESHOLD && rebootCoreGain(state) > 0;
}

export function createRebootedState(state: GameState, now = Date.now()): GameState {
  if (!canReboot(state)) return state;
  const fresh = createInitialState(now);
  fresh.settings = { ...state.settings };
  fresh.purchaseMode = state.purchaseMode;
  fresh.optimizationCores = state.optimizationCores + rebootCoreGain(state);
  fresh.rebootCount = state.rebootCount + 1;
  return fresh;
}
