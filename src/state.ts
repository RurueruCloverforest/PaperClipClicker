export type Theme = 'system' | 'light' | 'dark';
export type MachineId = 'autoClipper' | 'wireMachine' | 'clipFactory' | 'aiLine' | 'nanoForge' | 'swarmAssembler' | 'orbitalFoundry' | 'matterCompiler' | 'planetaryAssembler' | 'stellarHarvester' | 'galacticFleet' | 'causalOptimizer';
export type UpgradeId = 'preciseFingers' | 'reinforcedLever' | 'qualityCutter' | 'processOptimization' | 'selfImprovement' | 'parallelActuators' | 'nanoPrecision' | 'swarmSync' | 'orbitalLogistics' | 'recursiveMandate' | 'overloadProtocol' | 'resonanceAmplification' | 'crustalRefinement' | 'stellarSync' | 'selfReplication' | 'causalConvergence' | 'autoBuyCore';
export type PurchaseMode = 1 | 10 | 'max';
export type SignalBuffId = 'productionSurge' | 'precisionAssist' | 'signalBeacon';
export type DirectiveId = 'manualCalibration' | 'procurementOrder' | 'signalCapture';
export type SurveyId = 'near' | 'mid' | 'far';

export interface GameSettings {
  theme: Theme;
  compactNumbers: boolean;
}

export interface GameState {
  version: 1;
  clips: number;
  totalClips: number;
  machines: Record<MachineId, number>;
  upgrades: UpgradeId[];
  unlockedMachines: MachineId[];
  playTimeSeconds: number;
  startedAt: number;
  lastSavedAt: number;
  settings: GameSettings;
  purchaseMode: PurchaseMode;
  bonusEventsCollected: number;
  precisionTargetsCompleted: number;
  autoBuyEnabled: Record<MachineId, boolean>;
  phaseRewardsGranted: string[];
  interiorHarvests: number;
  wireCalibrationSuccesses: number;
  factoryQualityCorrect: number;
  traceAiSuccesses: number;
  nanoPurgeSuccesses: number;
  swarmSyncSuccesses: number;
  orbitalBerthSuccesses: number;
  matterCompileSuccesses: number;
  planetStripSuccesses: number;
  stellarSyncSuccesses: number;
  fleetSpreadSuccesses: number;
  causalCollapseSuccesses: number;
  surveysRecovered: number;
  surveyReturnsAt: Record<SurveyId, number>;
  maxClickCombo: number;
  capacitorStored: number;
  capacitorClaims: number;
  overclockMachine: MachineId | null;
  overclockExpiresAt: number;
  overclockCount: number;
  foldExpiresAt: number;
  foldCount: number;
  gaugeTarget: 0 | 1 | 2;
  gaugeReadyAt: number;
  gaugeHits: number;
  catalystActive: boolean;
  catalystSeconds: number;
  dispatchStored: number;
  dispatchReturnsAt: number;
  dispatchClaims: number;
  patchCount: number;
  windReadyAt: number;
  windCount: number;
  pulseReadyAt: number;
  pulseCount: number;
  scrapStored: number;
  scrapClaims: number;
  signalBuffExpiresAt: Record<SignalBuffId, number>;
  directiveProgress: Record<DirectiveId, number>;
  directiveCompletions: Record<DirectiveId, number>;
  optimizationCores: number;
  rebootCount: number;
}

export const MACHINE_IDS: MachineId[] = ['autoClipper', 'wireMachine', 'clipFactory', 'aiLine', 'nanoForge', 'swarmAssembler', 'orbitalFoundry', 'matterCompiler', 'planetaryAssembler', 'stellarHarvester', 'galacticFleet', 'causalOptimizer'];
export const UPGRADE_IDS: UpgradeId[] = ['preciseFingers', 'reinforcedLever', 'qualityCutter', 'processOptimization', 'selfImprovement', 'parallelActuators', 'nanoPrecision', 'swarmSync', 'orbitalLogistics', 'recursiveMandate', 'overloadProtocol', 'resonanceAmplification', 'crustalRefinement', 'stellarSync', 'selfReplication', 'causalConvergence', 'autoBuyCore'];

export function createInitialState(now = Date.now()): GameState {
  return {
    version: 1,
    clips: 0,
    totalClips: 0,
    machines: { autoClipper: 0, wireMachine: 0, clipFactory: 0, aiLine: 0, nanoForge: 0, swarmAssembler: 0, orbitalFoundry: 0, matterCompiler: 0, planetaryAssembler: 0, stellarHarvester: 0, galacticFleet: 0, causalOptimizer: 0 },
    upgrades: [],
    unlockedMachines: ['autoClipper'],
    playTimeSeconds: 0,
    startedAt: now,
    lastSavedAt: now,
    settings: { theme: 'system', compactNumbers: true },
    purchaseMode: 1,
    bonusEventsCollected: 0,
    precisionTargetsCompleted: 0,
    autoBuyEnabled: { autoClipper: false, wireMachine: false, clipFactory: false, aiLine: false, nanoForge: false, swarmAssembler: false, orbitalFoundry: false, matterCompiler: false, planetaryAssembler: false, stellarHarvester: false, galacticFleet: false, causalOptimizer: false },
    phaseRewardsGranted: [],
    interiorHarvests: 0,
    wireCalibrationSuccesses: 0,
    factoryQualityCorrect: 0,
    traceAiSuccesses: 0,
    nanoPurgeSuccesses: 0,
    swarmSyncSuccesses: 0,
    orbitalBerthSuccesses: 0,
    matterCompileSuccesses: 0,
    planetStripSuccesses: 0,
    stellarSyncSuccesses: 0,
    fleetSpreadSuccesses: 0,
    causalCollapseSuccesses: 0,
    surveysRecovered: 0,
    surveyReturnsAt: { near: 0, mid: 0, far: 0 },
    maxClickCombo: 0,
    capacitorStored: 0,
    capacitorClaims: 0,
    overclockMachine: null,
    overclockExpiresAt: 0,
    overclockCount: 0,
    foldExpiresAt: 0,
    foldCount: 0,
    gaugeTarget: 0,
    gaugeReadyAt: 0,
    gaugeHits: 0,
    catalystActive: false,
    catalystSeconds: 0,
    dispatchStored: 0,
    dispatchReturnsAt: 0,
    dispatchClaims: 0,
    patchCount: 0,
    windReadyAt: 0,
    windCount: 0,
    pulseReadyAt: 0,
    pulseCount: 0,
    scrapStored: 0,
    scrapClaims: 0,
    signalBuffExpiresAt: { productionSurge: 0, precisionAssist: 0, signalBeacon: 0 },
    directiveProgress: { manualCalibration: 0, procurementOrder: 0, signalCapture: 0 },
    directiveCompletions: { manualCalibration: 0, procurementOrder: 0, signalCapture: 0 },
    optimizationCores: 0,
    rebootCount: 0,
  };
}
