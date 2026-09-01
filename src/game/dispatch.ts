import type { GameState } from '../state';

export const DISPATCH_UNLOCK_CLIPS = 160;
export const DISPATCH_CHARGE_RATE = 0.2;
export const DISPATCH_CAPACITY_SECONDS = 15;
export const DISPATCH_MIN_CAPACITY = 40;
export const DISPATCH_TRANSIT_MS = 10_000;
export const DISPATCH_REWARD_MULT = 1.6;

export type DispatchStatus = 'filling' | 'transit' | 'ready';

export function isDispatchUnlocked(state: GameState): boolean {
  return state.totalClips >= DISPATCH_UNLOCK_CLIPS || state.dispatchStored > 0 || state.dispatchClaims > 0 || state.dispatchReturnsAt > 0;
}

export function dispatchStatus(state: GameState, now = Date.now()): DispatchStatus {
  if (state.dispatchReturnsAt > now) return 'transit';
  if (state.dispatchReturnsAt > 0) return 'ready';
  return 'filling';
}

export function dispatchCapacity(productionRate: number): number {
  return Math.max(DISPATCH_MIN_CAPACITY, productionRate * DISPATCH_CAPACITY_SECONDS);
}

export function chargeDispatch(state: GameState, seconds: number, productionRate: number, now = Date.now()): number {
  if (!isDispatchUnlocked(state)) return 0;
  if (dispatchStatus(state, now) !== 'filling') return 0;
  const cap = dispatchCapacity(productionRate);
  const added = productionRate * DISPATCH_CHARGE_RATE * Math.max(0, seconds);
  const next = Math.min(cap, state.dispatchStored + added);
  const gained = next - state.dispatchStored;
  state.dispatchStored = next;
  return gained;
}

export function startDispatch(state: GameState, now = Date.now()): boolean {
  if (dispatchStatus(state, now) !== 'filling') return false;
  if (state.dispatchStored <= 0) return false;
  state.dispatchReturnsAt = now + DISPATCH_TRANSIT_MS;
  return true;
}

export function collectDispatch(state: GameState, now = Date.now()): number {
  if (dispatchStatus(state, now) !== 'ready') return 0;
  const reward = state.dispatchStored * DISPATCH_REWARD_MULT;
  state.clips += reward;
  state.totalClips += reward;
  state.dispatchStored = 0;
  state.dispatchReturnsAt = 0;
  state.dispatchClaims += 1;
  return reward;
}
