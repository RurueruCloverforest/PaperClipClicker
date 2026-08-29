import type { GameState } from '../state';
import { clickProduction, productionPerSecond } from './clips';
import { anomalyRewardMultiplier, precisionRewardMultiplier } from './signalLab';

export type BonusOutcomeId = 'productionCache' | 'inventoryEcho';

export interface BonusReward {
  id: BonusOutcomeId;
  name: string;
  amount: number;
}

export function nextBonusDelay(random = Math.random, first = false): number {
  const minimum = first ? 20 : 30;
  const range = first ? 20 : 45;
  return minimum + Math.max(0, Math.min(1, random())) * range;
}

export function chooseBonusOutcome(random = Math.random): BonusOutcomeId {
  return random() < 0.5 ? 'productionCache' : 'inventoryEcho';
}

export function calculateBonusReward(state: GameState, id: BonusOutcomeId): number {
  const scaled = id === 'productionCache' ? productionPerSecond(state) * 60 : state.clips * 0.1;
  return Math.max(100, scaled);
}

export function applyBonusReward(state: GameState, id: BonusOutcomeId): BonusReward {
  const amount = calculateBonusReward(state, id) * anomalyRewardMultiplier(state);
  state.clips += amount;
  state.totalClips += amount;
  state.bonusEventsCollected += 1;
  return { id, name: id === 'productionCache' ? '生産キャッシュ' : '在庫エコー', amount };
}

export function nextPrecisionDelay(random = Math.random, first = false): number {
  const minimum = first ? 8 : 12;
  const range = first ? 8 : 16;
  return minimum + Math.max(0, Math.min(1, random())) * range;
}

export function precisionClickTarget(random = Math.random): number {
  return 3 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 5);
}

export function precisionPosition(random = Math.random): number {
  return Math.floor(Math.max(0, Math.min(0.999999, random())) * 6);
}

export function applyPrecisionReward(state: GameState, requiredClicks: number): number {
  const amount = Math.max(250, productionPerSecond(state) * 90, clickProduction(state) * requiredClicks * 25) * precisionRewardMultiplier(state);
  state.clips += amount;
  state.totalClips += amount;
  state.precisionTargetsCompleted += 1;
  return amount;
}
