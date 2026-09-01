import type { GameState } from '../state';

export const PATCH_UNLOCK_CLIPS = 120;
export const PATCH_BONUS = 0.04;
export const PATCH_CAP = 20;
export const PATCH_MIN_COST = 25;
export const PATCH_COST_SECONDS = 4;
export const PATCH_COST_GROWTH = 1.3;

export function isPatchUnlocked(state: GameState): boolean {
  return state.totalClips >= PATCH_UNLOCK_CLIPS || state.patchCount > 0;
}

export function isPatchMaxed(state: GameState): boolean {
  return state.patchCount >= PATCH_CAP;
}

export function patchMultiplier(state: GameState): number {
  return 1 + Math.min(PATCH_CAP, state.patchCount) * PATCH_BONUS;
}

export function patchCost(state: GameState, productionRate: number): number {
  if (isPatchMaxed(state)) return 0;
  return Math.ceil(Math.max(PATCH_MIN_COST, productionRate * PATCH_COST_SECONDS * PATCH_COST_GROWTH ** state.patchCount));
}

export function canBuyPatch(state: GameState, productionRate: number): boolean {
  if (!isPatchUnlocked(state) || isPatchMaxed(state)) return false;
  return state.clips + Number.EPSILON >= patchCost(state, productionRate);
}

export function buyPatch(state: GameState, productionRate: number): boolean {
  if (!canBuyPatch(state, productionRate)) return false;
  state.clips -= patchCost(state, productionRate);
  state.patchCount += 1;
  return true;
}
