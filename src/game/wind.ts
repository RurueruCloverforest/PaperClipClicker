import type { GameState } from '../state';

export const WIND_UNLOCK_CLIPS = 140;
export const WIND_MAX_SECONDS = 3;
export const WIND_MIN_SECONDS = 0.4;
export const WIND_COOLDOWN_MS = 8_000;
export const WIND_REWARD_PER_SECOND = 5;
export const WIND_MIN_REWARD = 15;

export function isWindUnlocked(state: GameState): boolean {
  return state.totalClips >= WIND_UNLOCK_CLIPS || state.windCount > 0 || state.windReadyAt > 0;
}

export function isWindReady(state: GameState, now = Date.now()): boolean {
  return isWindUnlocked(state) && state.windReadyAt <= now;
}

export function windReward(chargeSeconds: number, productionRate: number): number {
  const charge = Math.min(WIND_MAX_SECONDS, Math.max(0, chargeSeconds));
  if (charge + Number.EPSILON < WIND_MIN_SECONDS) return 0;
  return Math.max(WIND_MIN_REWARD, productionRate * WIND_REWARD_PER_SECOND * charge);
}

export function releaseWind(state: GameState, chargeSeconds: number, productionRate: number, now = Date.now()): number {
  if (!isWindReady(state, now)) return 0;
  const reward = windReward(chargeSeconds, productionRate);
  if (reward <= 0) return 0;
  state.clips += reward;
  state.totalClips += reward;
  state.windCount += 1;
  state.windReadyAt = now + WIND_COOLDOWN_MS;
  return reward;
}
