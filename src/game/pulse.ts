import type { GameState } from '../state';

export const PULSE_UNLOCK_CLIPS = 130;
export const PULSE_COOLDOWN_MS = 20_000;
export const PULSE_REWARD_SECONDS = 8;
export const PULSE_MIN_REWARD = 20;

export function isPulseUnlocked(state: GameState): boolean {
  return state.totalClips >= PULSE_UNLOCK_CLIPS || state.pulseCount > 0 || state.pulseReadyAt > 0;
}

export function isPulseReady(state: GameState, now = Date.now()): boolean {
  return isPulseUnlocked(state) && state.pulseReadyAt <= now;
}

export function pulseReward(productionRate: number): number {
  return Math.max(PULSE_MIN_REWARD, productionRate * PULSE_REWARD_SECONDS);
}

export function claimPulse(state: GameState, productionRate: number, now = Date.now()): number {
  if (!isPulseReady(state, now)) return 0;
  const reward = pulseReward(productionRate);
  state.clips += reward;
  state.totalClips += reward;
  state.pulseCount += 1;
  state.pulseReadyAt = now + PULSE_COOLDOWN_MS;
  return reward;
}
