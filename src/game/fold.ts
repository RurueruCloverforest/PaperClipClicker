import type { GameState } from '../state';

export const FOLD_UNLOCK_CLIPS = 200;
export const FOLD_COOLDOWN_MS = 15_000;
export const FOLD_COST_SECONDS = 8;
export const FOLD_REWARD_SECONDS = 20;
export const FOLD_MIN_COST = 50;
export const FOLD_MIN_REWARD = 80;

export function isFoldUnlocked(state: GameState): boolean {
  return state.totalClips >= FOLD_UNLOCK_CLIPS || state.foldCount > 0 || state.foldExpiresAt > 0;
}

export function isFoldCooling(state: GameState, now = Date.now()): boolean {
  return state.foldExpiresAt > now;
}

export function foldCost(productionRate: number): number {
  return Math.ceil(Math.max(FOLD_MIN_COST, productionRate * FOLD_COST_SECONDS));
}

export function foldReward(productionRate: number): number {
  return Math.max(FOLD_MIN_REWARD, productionRate * FOLD_REWARD_SECONDS);
}

export function canStartFold(state: GameState, productionRate: number, now = Date.now()): boolean {
  if (!isFoldUnlocked(state)) return false;
  if (isFoldCooling(state, now)) return false;
  return state.clips + Number.EPSILON >= foldCost(productionRate);
}

export function startFold(state: GameState, productionRate: number, now = Date.now()): number {
  if (!canStartFold(state, productionRate, now)) return 0;
  const cost = foldCost(productionRate);
  const reward = foldReward(productionRate);
  state.clips -= cost;
  state.clips += reward;
  state.totalClips += reward;
  state.foldExpiresAt = now + FOLD_COOLDOWN_MS;
  state.foldCount += 1;
  return reward;
}
