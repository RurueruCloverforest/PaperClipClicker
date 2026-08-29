import { MACHINE_IDS, type GameState } from '../state';

export interface MilestoneDefinition {
  count: number;
  multiplier: number;
  name: string;
}

export const MILESTONES: MilestoneDefinition[] = [
  { count: 10, multiplier: 2, name: '安定稼働' },
  { count: 25, multiplier: 4, name: '並列生産' },
  { count: 50, multiplier: 8, name: '大規模展開' },
  { count: 100, multiplier: 16, name: '完全最適化' },
];

export const TOTAL_MILESTONES = MILESTONES.length * MACHINE_IDS.length;

export interface MilestoneStatus {
  multiplier: number;
  achieved: number;
  currentName: string;
  next: MilestoneDefinition | null;
  progress: number;
}

export function milestoneStatus(owned: number): MilestoneStatus {
  const achievedDefinitions = MILESTONES.filter((milestone) => owned >= milestone.count);
  const current = achievedDefinitions.at(-1);
  const next = MILESTONES.find((milestone) => owned < milestone.count) ?? null;
  return {
    multiplier: current?.multiplier ?? 1,
    achieved: achievedDefinitions.length,
    currentName: current?.name ?? '未達成',
    next,
    progress: next ? Math.min(1, owned / next.count) : 1,
  };
}

export function crossedMilestones(before: number, after: number): MilestoneDefinition[] {
  return MILESTONES.filter((milestone) => before < milestone.count && after >= milestone.count);
}

export function totalAchievedMilestones(state: GameState): number {
  return MACHINE_IDS.reduce((total, id) => total + milestoneStatus(state.machines[id]).achieved, 0);
}
