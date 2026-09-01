import type { GameState } from '../state';

export const TRIM_UNLOCK_CLIPS = 90;
export const TRIM_BONUS = 0.03;
export const TRIM_CAP = 15;
export const TRIM_MIN_COST = 20;
export const TRIM_COST_SECONDS = 3;
export const TRIM_COST_GROWTH = 1.35;

export function isTrimUnlocked(state: GameState): boolean {
  return state.totalClips >= TRIM_UNLOCK_CLIPS || state.trimCount > 0;
}

export function isTrimMaxed(state: GameState): boolean {
  return state.trimCount >= TRIM_CAP;
}

export function trimMultiplier(state: GameState): number {
  return Math.max(1 - TRIM_CAP * TRIM_BONUS, 1 - Math.min(TRIM_CAP, state.trimCount) * TRIM_BONUS);
}

export function trimCost(state: GameState, productionRate: number): number {
  if (isTrimMaxed(state)) return 0;
  return Math.ceil(Math.max(TRIM_MIN_COST, productionRate * TRIM_COST_SECONDS * TRIM_COST_GROWTH ** state.trimCount));
}

export function canBuyTrim(state: GameState, productionRate: number): boolean {
  if (!isTrimUnlocked(state) || isTrimMaxed(state)) return false;
  return state.clips + Number.EPSILON >= trimCost(state, productionRate);
}

export function buyTrim(state: GameState, productionRate: number): boolean {
  if (!canBuyTrim(state, productionRate)) return false;
  state.clips -= trimCost(state, productionRate);
  state.trimCount += 1;
  return true;
}
