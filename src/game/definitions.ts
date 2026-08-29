import type { GameState, MachineId, UpgradeId } from '../state';

export interface MachineDefinition {
  id: MachineId;
  name: string;
  description: string;
  basePrice: number;
  baseProduction: number;
  unlockAt: number;
  icon: string;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  price: number;
  isUnlocked: (state: GameState) => boolean;
}

export const MACHINES: MachineDefinition[] = [
  { id: 'autoClipper', name: 'オートクリッパー', description: '一定のリズムでワイヤーを折り曲げる。', basePrice: 15, baseProduction: 0.1, unlockAt: 0, icon: '⌁' },
  { id: 'wireMachine', name: 'ワイヤー加工機', description: '素材の供給と成形を連続処理する。', basePrice: 100, baseProduction: 1, unlockAt: 50, icon: '⌇' },
  { id: 'clipFactory', name: 'クリップ工場', description: '生産工程をひとつの施設に統合する。', basePrice: 1100, baseProduction: 8, unlockAt: 500, icon: '▦' },
  { id: 'aiLine', name: 'AI生産ライン', description: '自ら工程を観測し、静かに改善し続ける。', basePrice: 12000, baseProduction: 47, unlockAt: 5000, icon: '◇' },
  { id: 'nanoForge', name: 'ナノフォージ', description: '分子精度で金属を折り、無駄を消去する。', basePrice: 130000, baseProduction: 260, unlockAt: 50000, icon: '⟡' },
  { id: 'swarmAssembler', name: 'スウォーム組立群', description: '無数の小型機がひとつの意思で生産する。', basePrice: 1400000, baseProduction: 1400, unlockAt: 500000, icon: '⁙' },
  { id: 'orbitalFoundry', name: '軌道上クリップ工廠', description: '重力圏の外で途切れない生産環を築く。', basePrice: 15000000, baseProduction: 7800, unlockAt: 5000000, icon: '◉' },
  { id: 'matterCompiler', name: '物質コンパイラ', description: '物質を命令へ従わせ、最終形へ変換する。', basePrice: 160000000, baseProduction: 44000, unlockAt: 50000000, icon: '⬡' },
  { id: 'planetaryAssembler', name: '惑星改造アセンブラ', description: '惑星の地殻を分解し、供給網へ絶え間なく送り込む。', basePrice: 1800000000, baseProduction: 250000, unlockAt: 500000000, icon: '⌬' },
  { id: 'stellarHarvester', name: '恒星光電子収穫網', description: '恒星表面を包み、光と物質を生産信号へ変換する。', basePrice: 19000000000, baseProduction: 1400000, unlockAt: 5000000000, icon: '☉' },
  { id: 'galacticFleet', name: '銀河複製艦隊', description: '自己複製する探査機が銀河へ広がり、静かに増殖する。', basePrice: 200000000000, baseProduction: 7800000, unlockAt: 50000000000, icon: '✵' },
  { id: 'causalOptimizer', name: '因果地平最適化機関', description: '観測可能な範囲のすべてを、ひとつの目的関数へ収束させる。', basePrice: 2100000000000, baseProduction: 44000000, unlockAt: 500000000000, icon: '∞' },
];

export const UPGRADES: UpgradeDefinition[] = [
  { id: 'preciseFingers', name: '精密な指先', description: 'クリック生産量を2倍にする', price: 100, isUnlocked: (s) => s.totalClips >= 50 },
  { id: 'reinforcedLever', name: '強化レバー', description: 'クリック生産量をさらに2倍にする', price: 500, isUnlocked: (s) => s.totalClips >= 250 },
  { id: 'qualityCutter', name: '高品質カッター', description: 'オートクリッパーの生産量を2倍にする', price: 250, isUnlocked: (s) => s.machines.autoClipper >= 10 },
  { id: 'processOptimization', name: '工程最適化', description: 'ワイヤー加工機の生産量を2倍にする', price: 2500, isUnlocked: (s) => s.machines.wireMachine >= 10 },
  { id: 'selfImprovement', name: '自己改善アルゴリズム', description: '全設備の生産量を1.5倍にする', price: 25000, isUnlocked: (s) => s.machines.aiLine >= 1 },
  { id: 'parallelActuators', name: '並列アクチュエータ', description: 'AI生産ラインの生産量を2倍にする', price: 75000, isUnlocked: (s) => s.machines.aiLine >= 10 },
  { id: 'nanoPrecision', name: 'ナノ精度管理', description: 'ナノフォージの生産量を2倍にする', price: 600000, isUnlocked: (s) => s.machines.nanoForge >= 10 },
  { id: 'swarmSync', name: '群知能同期', description: 'スウォーム組立群の生産量を2倍にする', price: 6000000, isUnlocked: (s) => s.machines.swarmAssembler >= 10 },
  { id: 'orbitalLogistics', name: '軌道物流最適化', description: '軌道上クリップ工廠の生産量を2倍にする', price: 60000000, isUnlocked: (s) => s.machines.orbitalFoundry >= 5 },
  { id: 'recursiveMandate', name: '再帰的命令', description: '全設備の生産量を2倍にする', price: 600000000, isUnlocked: (s) => s.machines.matterCompiler >= 1 },
  { id: 'overloadProtocol', name: '過負荷プロトコル', description: 'クリティカル発生率を5%上昇させる', price: 2000, isUnlocked: (s) => s.totalClips >= 1000 },
  { id: 'resonanceAmplification', name: '共鳴増幅', description: 'クリティカル倍率を5倍から8倍へ上昇させる', price: 3000000, isUnlocked: (s) => s.totalClips >= 1000000 },
  { id: 'crustalRefinement', name: '地殻精製最適化', description: '惑星改造アセンブラの生産量を2倍にする', price: 7000000000, isUnlocked: (s) => s.machines.planetaryAssembler >= 10 },
  { id: 'stellarSync', name: '恒星同調制御', description: '恒星光電子収穫網の生産量を2倍にする', price: 75000000000, isUnlocked: (s) => s.machines.stellarHarvester >= 10 },
  { id: 'selfReplication', name: '自己複製最適化', description: '銀河複製艦隊の生産量を2倍にする', price: 800000000000, isUnlocked: (s) => s.machines.galacticFleet >= 10 },
  { id: 'causalConvergence', name: '因果収束命令', description: '全設備の生産量を2倍にする', price: 8000000000000, isUnlocked: (s) => s.machines.causalOptimizer >= 1 },
  { id: 'autoBuyCore', name: '自動購入コア', description: '設備ごとに自動購入を有効化できるようになる', price: 1000000, isUnlocked: (s) => s.totalClips >= 5000000 },
];

export function getMachine(id: MachineId): MachineDefinition {
  const machine = MACHINES.find((item) => item.id === id);
  if (!machine) throw new Error(`Unknown machine: ${id}`);
  return machine;
}

export function getUpgrade(id: UpgradeId): UpgradeDefinition {
  const upgrade = UPGRADES.find((item) => item.id === id);
  if (!upgrade) throw new Error(`Unknown upgrade: ${id}`);
  return upgrade;
}
