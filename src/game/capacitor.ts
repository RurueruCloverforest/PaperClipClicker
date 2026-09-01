import type { GameState } from '../state';
import { productionPerSecond } from './clips';

export const CAPACITOR_UNLOCK_CLIPS = 100;
export const CAPACITOR_CHARGE_RATE = 0.25;
export const CAPACITOR_CAPACITY_SECONDS = 40;
export const CAPACITOR_MIN_CAPACITY = 50;

export function isCapacitorUnlocked(state: GameState): boolean {
  return state.totalClips >= CAPACITOR_UNLOCK_CLIPS || state.capacitorStored > 0 || state.capacitorClaims > 0;
}

export function capacitorCapacity(state: GameState): number {
  return Math.max(CAPACITOR_MIN_CAPACITY, productionPerSecond(state) * CAPACITOR_CAPACITY_SECONDS);
}

export function chargeCapacitor(state: GameState, seconds: number): number {
  const cap = capacitorCapacity(state);
  const added = productionPerSecond(state) * CAPACITOR_CHARGE_RATE * Math.max(0, seconds);
  const next = Math.min(cap, state.capacitorStored + added);
  const gained = next - state.capacitorStored;
  state.capacitorStored = next;
  return gained;
}

export function claimCapacitor(state: GameState): number {
  const amount = state.capacitorStored;
  if (amount <= 0) return 0;
  state.clips += amount;
  state.totalClips += amount;
  state.capacitorStored = 0;
  state.capacitorClaims += 1;
  return amount;
}
