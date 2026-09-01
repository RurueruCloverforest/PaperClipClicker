import type { GameState } from '../state';

export const CATALYST_UNLOCK_CLIPS = 180;
export const CATALYST_MULTIPLIER = 1.4;
export const CATALYST_DRAIN_RATE = 0.2;
export const CATALYST_MIN_DRAIN = 0.5;

export function isCatalystUnlocked(state: GameState): boolean {
  return state.totalClips >= CATALYST_UNLOCK_CLIPS || state.catalystSeconds > 0 || state.catalystActive;
}

export function catalystMultiplier(state: GameState): number {
  return state.catalystActive ? CATALYST_MULTIPLIER : 1;
}

export function catalystDrainPerSecond(unboostedRate: number): number {
  return Math.max(CATALYST_MIN_DRAIN, unboostedRate * CATALYST_DRAIN_RATE);
}

export function canEnableCatalyst(state: GameState, unboostedRate: number): boolean {
  if (!isCatalystUnlocked(state)) return false;
  return state.clips + Number.EPSILON >= catalystDrainPerSecond(unboostedRate);
}

export function toggleCatalyst(state: GameState, unboostedRate: number): boolean {
  if (!isCatalystUnlocked(state)) return false;
  if (state.catalystActive) {
    state.catalystActive = false;
    return true;
  }
  if (!canEnableCatalyst(state, unboostedRate)) return false;
  state.catalystActive = true;
  return true;
}

export function tickCatalyst(state: GameState, seconds: number, unboostedRate: number): number {
  if (!state.catalystActive) return 0;
  const drain = catalystDrainPerSecond(unboostedRate) * Math.max(0, seconds);
  if (state.clips + Number.EPSILON < drain) {
    state.catalystActive = false;
    return 0;
  }
  state.clips -= drain;
  state.catalystSeconds += Math.max(0, seconds);
  return drain;
}
