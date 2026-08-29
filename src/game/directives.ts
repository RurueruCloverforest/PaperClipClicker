import type { DirectiveId, GameState } from '../state';
import { clickProduction, productionPerSecond } from './clips';

export interface DirectiveDefinition {
  id: DirectiveId;
  code: string;
  name: string;
  description: string;
}

export const DIRECTIVES: DirectiveDefinition[] = [
  { id: 'manualCalibration', code: 'ORD-MAN', name: '手動校正', description: '中心生産オブジェクトを操作する' },
  { id: 'procurementOrder', code: 'ORD-BUY', name: '調達命令', description: '生産設備を導入する' },
  { id: 'signalCapture', code: 'ORD-SIG', name: '信号捕捉', description: '異常または精密信号を回収する' },
];

export function directiveTarget(state: GameState, id: DirectiveId): number {
  const rank = state.directiveCompletions[id];
  if (id === 'manualCalibration') return Math.min(100, 25 + rank * 5);
  if (id === 'procurementOrder') return Math.min(50, 10 + rank * 2);
  return Math.min(10, 3 + Math.floor(rank / 2));
}

export function directiveReward(state: GameState, id: DirectiveId): number {
  const pps = productionPerSecond(state);
  let base = id === 'manualCalibration'
    ? Math.max(250, clickProduction(state) * 100, pps * 60)
    : id === 'procurementOrder' ? Math.max(1_000, pps * 180) : Math.max(2_500, pps * 300);
  base *= 1 + state.directiveCompletions[id] * 0.25;
  return Math.ceil(base);
}

export function advanceDirective(state: GameState, id: DirectiveId, amount = 1): void {
  state.directiveProgress[id] += Math.max(0, Math.floor(amount));
}

export function canClaimDirective(state: GameState, id: DirectiveId): boolean {
  return state.directiveProgress[id] >= directiveTarget(state, id);
}

export function claimDirective(state: GameState, id: DirectiveId): number {
  const target = directiveTarget(state, id);
  if (state.directiveProgress[id] < target) return 0;
  const reward = directiveReward(state, id);
  state.directiveProgress[id] -= target;
  state.directiveCompletions[id] += 1;
  state.clips += reward;
  state.totalClips += reward;
  return reward;
}
