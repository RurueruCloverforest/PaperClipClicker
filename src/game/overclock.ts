import type { GameState, MachineId } from '../state';

export const OVERCLOCK_UNLOCK_CLIPS = 250;
export const OVERCLOCK_DURATION_MS = 20_000;
export const OVERCLOCK_MULTIPLIER = 3;

export function isOverclockUnlocked(state: GameState): boolean {
  return state.totalClips >= OVERCLOCK_UNLOCK_CLIPS || state.overclockCount > 0 || state.overclockExpiresAt > 0;
}

export function isOverclockActive(state: GameState, id: MachineId, now = Date.now()): boolean {
  return state.overclockMachine === id && state.overclockExpiresAt > now;
}

export function overclockMultiplier(state: GameState, id: MachineId, now = Date.now()): number {
  return isOverclockActive(state, id, now) ? OVERCLOCK_MULTIPLIER : 1;
}

export function overclockCost(productionRate: number): number {
  return Math.ceil(Math.max(OVERCLOCK_UNLOCK_CLIPS, productionRate * 25));
}

export function canStartOverclock(state: GameState, id: MachineId, productionRate: number, now = Date.now()): boolean {
  if (!isOverclockUnlocked(state)) return false;
  if (state.machines[id] < 1) return false;
  if (state.overclockExpiresAt > now) return false;
  return state.clips + Number.EPSILON >= overclockCost(productionRate);
}

export function startOverclock(state: GameState, id: MachineId, productionRate: number, now = Date.now()): boolean {
  if (!canStartOverclock(state, id, productionRate, now)) return false;
  state.clips -= overclockCost(productionRate);
  state.overclockMachine = id;
  state.overclockExpiresAt = now + OVERCLOCK_DURATION_MS;
  state.overclockCount += 1;
  return true;
}
