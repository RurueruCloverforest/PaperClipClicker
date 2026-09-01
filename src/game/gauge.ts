import type { GameState } from '../state';

export type GaugeId = 0 | 1 | 2;

export const GAUGE_UNLOCK_CLIPS = 150;
export const GAUGE_SUCCESS_MS = 8_000;
export const GAUGE_MISS_MS = 2_000;
export const GAUGE_REWARD_SECONDS = 6;
export const GAUGE_MIN_REWARD = 20;
export const GAUGE_LABELS = ['細', '並', '太'] as const;
export const GAUGE_IDS: GaugeId[] = [0, 1, 2];

export function isGaugeUnlocked(state: GameState): boolean {
  return state.totalClips >= GAUGE_UNLOCK_CLIPS || state.gaugeHits > 0 || state.gaugeReadyAt > 0;
}

export function isGaugeReady(state: GameState, now = Date.now()): boolean {
  return isGaugeUnlocked(state) && state.gaugeReadyAt <= now;
}

export function gaugeReward(productionRate: number): number {
  return Math.max(GAUGE_MIN_REWARD, productionRate * GAUGE_REWARD_SECONDS);
}

export function nextGaugeTarget(current: GaugeId, random = Math.random): GaugeId {
  const rolled = Math.floor(random() * 3) as GaugeId;
  if (GAUGE_IDS.includes(rolled) && rolled !== current) return rolled;
  return ((current + 1) % 3) as GaugeId;
}

export function pickGauge(state: GameState, id: GaugeId, productionRate: number, now = Date.now(), random = Math.random): number {
  if (!isGaugeReady(state, now)) return 0;
  if (id !== state.gaugeTarget) {
    state.gaugeReadyAt = now + GAUGE_MISS_MS;
    return 0;
  }
  const reward = gaugeReward(productionRate);
  state.clips += reward;
  state.totalClips += reward;
  state.gaugeHits += 1;
  state.gaugeTarget = nextGaugeTarget(state.gaugeTarget, random);
  state.gaugeReadyAt = now + GAUGE_SUCCESS_MS;
  return reward;
}
