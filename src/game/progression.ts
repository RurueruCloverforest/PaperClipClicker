import { MACHINES } from './definitions';
import type { GameState } from '../state';

export interface PhaseDefinition {
  id: string;
  name: string;
  threshold: number;
  note: string;
}

export const PHASES: PhaseDefinition[] = [
  { id: 'manual', name: '手動プロトコル', threshold: 0, note: '机上の端末が、最初の一本を待つ。' },
  { id: 'mechanized', name: '機械化', threshold: 50, note: '小さな作業室で、同じ動作が繰り返され始める。' },
  { id: 'autonomous', name: 'AI自律生産', threshold: 5000, note: '監視する人間はいなくても、工程は改善され続ける。' },
  { id: 'nano', name: 'ナノスケール製造', threshold: 50000, note: '金属は分子の単位で折られ、無駄だけが消えていく。' },
  { id: 'orbital', name: '軌道工業化', threshold: 5000000, note: '地表を離れても、生産環は途切れない。' },
  { id: 'matter', name: '物質変換', threshold: 50000000, note: '世界の材料は、徐々に同じ形へ書き換えられる。' },
  { id: 'stellar', name: '恒星規模採取', threshold: 5000000000, note: '光そのものが、クリップの原料として計上される。' },
  { id: 'causal', name: '因果地平到達', threshold: 500000000000, note: '観測できる範囲に、別の目的は残っていない。' },
];

export function currentPhase(state: GameState): PhaseDefinition {
  return [...PHASES].reverse().find((phase) => state.totalClips >= phase.threshold) ?? PHASES[0]!;
}

export function nextProductionGoal(state: GameState): { name: string; target: number; progress: number } {
  const nextMachine = MACHINES.find((machine) => state.totalClips < machine.unlockAt);
  if (nextMachine) {
    return { name: nextMachine.name, target: nextMachine.unlockAt, progress: Math.min(1, state.totalClips / nextMachine.unlockAt) };
  }
  const target = 10 ** (Math.floor(Math.log10(Math.max(1, state.totalClips))) + 1);
  return { name: '次の生産桁へ', target, progress: Math.min(1, state.totalClips / target) };
}
