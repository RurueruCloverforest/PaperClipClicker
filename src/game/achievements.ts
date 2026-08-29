import { MACHINE_IDS, type GameState } from '../state';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
}

const totalMachines = (state: GameState): number => MACHINE_IDS.reduce((sum, id) => sum + state.machines[id], 0);

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'firstClip', name: '最初の一本', description: '累計1クリップ生産', isUnlocked: (s) => s.totalClips >= 1 },
  { id: 'hundredClips', name: '机いっぱい', description: '累計100クリップ生産', isUnlocked: (s) => s.totalClips >= 100 },
  { id: 'tenThousandClips', name: '小さな産業', description: '累計10,000クリップ生産', isUnlocked: (s) => s.totalClips >= 10000 },
  { id: 'millionClips', name: '百万の命令', description: '累計1,000,000クリップ生産', isUnlocked: (s) => s.totalClips >= 1000000 },
  { id: 'hundredMillionClips', name: '地平線を覆う', description: '累計100,000,000クリップ生産', isUnlocked: (s) => s.totalClips >= 100000000 },
  { id: 'billionClips', name: '十億の回答', description: '累計1,000,000,000クリップ生産', isUnlocked: (s) => s.totalClips >= 1000000000 },
  { id: 'firstMachine', name: '自動化の始まり', description: '設備を合計1台所有', isUnlocked: (s) => totalMachines(s) >= 1 },
  { id: 'tenMachines', name: '機械室', description: '設備を合計10台所有', isUnlocked: (s) => totalMachines(s) >= 10 },
  { id: 'fiftyMachines', name: '生産区域', description: '設備を合計50台所有', isUnlocked: (s) => totalMachines(s) >= 50 },
  { id: 'hundredMachines', name: '止まらない工場', description: '設備を合計100台所有', isUnlocked: (s) => totalMachines(s) >= 100 },
  { id: 'firstUpgrade', name: '改善の余地', description: 'アップグレードを1個導入', isUnlocked: (s) => s.upgrades.length >= 1 },
  { id: 'fiveUpgrades', name: '最適化傾向', description: 'アップグレードを5個導入', isUnlocked: (s) => s.upgrades.length >= 5 },
  { id: 'allUpgrades', name: '自己改善完了', description: 'アップグレードを16個導入', isUnlocked: (s) => s.upgrades.length >= 16 },
  { id: 'fullSpectrum', name: '全領域生産', description: '12種類すべての設備を1台以上所有', isUnlocked: (s) => MACHINE_IDS.every((id) => s.machines[id] >= 1) },
];

export function unlockedAchievements(state: GameState): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.isUnlocked(state));
}

export function unlockedAchievementIds(state: GameState): string[] {
  return unlockedAchievements(state).map((achievement) => achievement.id);
}

export function achievementProductionMultiplier(state: GameState): number {
  return 1 + unlockedAchievements(state).length * 0.02;
}
