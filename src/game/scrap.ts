import type { GameState } from '../state';

export const SCRAP_UNLOCK_CLIPS = 110;
export const SCRAP_RATE = 0.08;
export const SCRAP_CAPACITY_SECONDS = 20;
export const SCRAP_MIN_CAPACITY = 30;

export function isScrapUnlocked(state: GameState): boolean {
  return state.totalClips >= SCRAP_UNLOCK_CLIPS || state.scrapStored > 0 || state.scrapClaims > 0;
}

export function scrapCapacity(productionRate: number): number {
  return Math.max(SCRAP_MIN_CAPACITY, productionRate * SCRAP_CAPACITY_SECONDS);
}

export function chargeScrap(state: GameState, spent: number, productionRate: number): number {
  if (!isScrapUnlocked(state) || spent <= 0) return 0;
  const cap = scrapCapacity(productionRate);
  const added = spent * SCRAP_RATE;
  const next = Math.min(cap, state.scrapStored + added);
  const gained = next - state.scrapStored;
  state.scrapStored = next;
  return gained;
}

export function claimScrap(state: GameState): number {
  const amount = state.scrapStored;
  if (amount <= 0) return 0;
  state.clips += amount;
  state.totalClips += amount;
  state.scrapStored = 0;
  state.scrapClaims += 1;
  return amount;
}
