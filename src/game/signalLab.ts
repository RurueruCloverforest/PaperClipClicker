import type { GameState, SignalBuffId } from '../state';

export interface SignalBuffDefinition {
  id: SignalBuffId;
  code: string;
  name: string;
  durationSeconds: number;
  minimumCost: number;
  productionSecondsCost: number;
  description: string;
}

export const SIGNAL_BUFFS: SignalBuffDefinition[] = [
  { id: 'productionSurge', code: 'PWR-05', name: '生産過給', durationSeconds: 300, minimumCost: 1_000, productionSecondsCost: 120, description: '全設備生産 ×2' },
  { id: 'precisionAssist', code: 'PRD-15', name: '精密予測', durationSeconds: 900, minimumCost: 5_000, productionSecondsCost: 600, description: '精密信号 +1秒・報酬×2' },
  { id: 'signalBeacon', code: 'BCN-60', name: '信号ビーコン', durationSeconds: 3_600, minimumCost: 25_000, productionSecondsCost: 1_800, description: '信号間隔×0.6・報酬×1.5' },
];

export function isSignalBuffActive(state: GameState, id: SignalBuffId, now = Date.now()): boolean {
  return state.signalBuffExpiresAt[id] > now;
}

export function signalBuffCost(id: SignalBuffId, productionRate: number): number {
  const buff = SIGNAL_BUFFS.find((item) => item.id === id)!;
  return Math.ceil(Math.max(buff.minimumCost, productionRate * buff.productionSecondsCost));
}

export function activateSignalBuff(state: GameState, id: SignalBuffId, productionRate: number, now = Date.now()): boolean {
  if (isSignalBuffActive(state, id, now)) return false;
  const cost = signalBuffCost(id, productionRate);
  if (state.clips + Number.EPSILON < cost) return false;
  state.clips -= cost;
  state.signalBuffExpiresAt[id] = now + SIGNAL_BUFFS.find((item) => item.id === id)!.durationSeconds * 1000;
  return true;
}

export function activeSignalBuffs(state: GameState, now = Date.now()): SignalBuffId[] {
  return SIGNAL_BUFFS.map((item) => item.id).filter((id) => isSignalBuffActive(state, id, now));
}

export function signalEquipmentMultiplier(state: GameState, now = Date.now()): number {
  let multiplier = isSignalBuffActive(state, 'productionSurge', now) ? 2 : 1;
  if (activeSignalBuffs(state, now).length === 3) multiplier *= 1.5;
  return multiplier;
}

export function signalClickMultiplier(state: GameState, now = Date.now()): number {
  return isSignalBuffActive(state, 'productionSurge', now) && isSignalBuffActive(state, 'precisionAssist', now) ? 3 : 1;
}

export function signalIntervalMultiplier(state: GameState, now = Date.now()): number {
  return isSignalBuffActive(state, 'signalBeacon', now) ? 0.6 : 1;
}

export function anomalyRewardMultiplier(state: GameState, now = Date.now()): number {
  if (!isSignalBuffActive(state, 'signalBeacon', now)) return 1;
  return isSignalBuffActive(state, 'productionSurge', now) ? 3 : 1.5;
}

export function precisionRewardMultiplier(state: GameState, now = Date.now()): number {
  if (!isSignalBuffActive(state, 'precisionAssist', now)) return 1;
  return isSignalBuffActive(state, 'signalBeacon', now) ? 3 : 2;
}

export function precisionDuration(state: GameState, baseSeconds: number, now = Date.now()): number {
  return baseSeconds + (isSignalBuffActive(state, 'precisionAssist', now) ? 1 : 0);
}
