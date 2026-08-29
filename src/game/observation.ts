import type { GameState } from '../state';
import { productionPerSecond } from './clips';
import { PHASES, type PhaseDefinition } from './progression';

export function phaseRewardAmount(state: GameState): number {
  return Math.max(100, productionPerSecond(state) * 90);
}

export function reachedRewardPhases(state: GameState): PhaseDefinition[] {
  return PHASES.filter((phase) => phase.threshold > 0 && state.totalClips >= phase.threshold);
}

export function markReachedPhaseRewardsGranted(state: GameState): void {
  for (const phase of reachedRewardPhases(state)) {
    if (!state.phaseRewardsGranted.includes(phase.id)) state.phaseRewardsGranted.push(phase.id);
  }
}

export function grantDuePhaseRewards(state: GameState): { phase: PhaseDefinition; amount: number }[] {
  const granted: { phase: PhaseDefinition; amount: number }[] = [];
  for (let step = 0; step < PHASES.length; step += 1) {
    const due = reachedRewardPhases(state).filter((phase) => !state.phaseRewardsGranted.includes(phase.id));
    if (due.length === 0) break;
    for (const phase of due) {
      const amount = phaseRewardAmount(state);
      state.clips += amount;
      state.totalClips += amount;
      state.phaseRewardsGranted.push(phase.id);
      granted.push({ phase, amount });
    }
  }
  return granted;
}
