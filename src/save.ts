import { createInitialState, MACHINE_IDS, UPGRADE_IDS, type DirectiveId, type GameState, type MachineId, type PurchaseMode, type SignalBuffId, type Theme, type UpgradeId } from './state';
import { produceForDuration } from './game/clips';
import { PHASES } from './game/progression';
import { markReachedPhaseRewardsGranted } from './game/observation';

const SAVE_KEY = 'paperclip-protocol-save-v1';
const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

export interface LoadResult {
  state: GameState;
  offlineSeconds: number;
  offlineClips: number;
  recovered: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function parseTheme(value: unknown): Theme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function parsePurchaseMode(value: unknown): PurchaseMode {
  return value === 10 || value === 'max' ? value : 1;
}

function normalize(raw: unknown, now: number): GameState {
  if (!isRecord(raw) || raw.version !== 1) throw new Error('Unsupported save');
  const initial = createInitialState(now);
  const machinesRaw = isRecord(raw.machines) ? raw.machines : {};
  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const machines = { ...initial.machines };
  for (const id of MACHINE_IDS) machines[id] = Math.floor(finite(machinesRaw[id], 0));
  const upgrades = Array.isArray(raw.upgrades)
    ? [...new Set(raw.upgrades.filter((id): id is UpgradeId => typeof id === 'string' && UPGRADE_IDS.includes(id as UpgradeId)))]
    : [];
  const unlocked = Array.isArray(raw.unlockedMachines)
    ? [...new Set(raw.unlockedMachines.filter((id): id is MachineId => typeof id === 'string' && MACHINE_IDS.includes(id as MachineId)))]
    : ['autoClipper' as MachineId];
  if (!unlocked.includes('autoClipper')) unlocked.unshift('autoClipper');
  const autoBuyRaw = isRecord(raw.autoBuyEnabled) ? raw.autoBuyEnabled : {};
  const autoBuyEnabled = { ...initial.autoBuyEnabled };
  for (const id of MACHINE_IDS) autoBuyEnabled[id] = typeof autoBuyRaw[id] === 'boolean' ? autoBuyRaw[id] : false;
  const knownPhaseIds = new Set(PHASES.map((phase) => phase.id));
  const storedPhaseRewards = raw.phaseRewardsGranted;
  const hasStoredPhaseRewards = Array.isArray(storedPhaseRewards);
  const phaseRewardsGranted = hasStoredPhaseRewards
    ? [...new Set(storedPhaseRewards.filter((id): id is string => typeof id === 'string' && knownPhaseIds.has(id)))]
    : [];
  const state: GameState = {
    version: 1,
    clips: finite(raw.clips, 0),
    totalClips: finite(raw.totalClips, 0),
    machines,
    upgrades,
    unlockedMachines: unlocked,
    playTimeSeconds: finite(raw.playTimeSeconds, 0),
    startedAt: finite(raw.startedAt, now),
    lastSavedAt: finite(raw.lastSavedAt, now),
    settings: {
      theme: parseTheme(settingsRaw.theme),
      compactNumbers: typeof settingsRaw.compactNumbers === 'boolean' ? settingsRaw.compactNumbers : true,
    },
    purchaseMode: parsePurchaseMode(raw.purchaseMode),
    bonusEventsCollected: Math.floor(finite(raw.bonusEventsCollected, 0)),
    precisionTargetsCompleted: Math.floor(finite(raw.precisionTargetsCompleted, 0)),
    autoBuyEnabled,
    phaseRewardsGranted,
    interiorHarvests: Math.floor(finite(raw.interiorHarvests, 0)),
    wireCalibrationSuccesses: Math.floor(finite(raw.wireCalibrationSuccesses, 0)),
    factoryQualityCorrect: Math.floor(finite(raw.factoryQualityCorrect, 0)),
    traceAiSuccesses: Math.floor(finite(raw.traceAiSuccesses, 0)),
    nanoPurgeSuccesses: Math.floor(finite(raw.nanoPurgeSuccesses, 0)),
    swarmSyncSuccesses: Math.floor(finite(raw.swarmSyncSuccesses, 0)),
    orbitalBerthSuccesses: Math.floor(finite(raw.orbitalBerthSuccesses, 0)),
    matterCompileSuccesses: Math.floor(finite(raw.matterCompileSuccesses, 0)),
    planetStripSuccesses: Math.floor(finite(raw.planetStripSuccesses, 0)),
    stellarSyncSuccesses: Math.floor(finite(raw.stellarSyncSuccesses, 0)),
    fleetSpreadSuccesses: Math.floor(finite(raw.fleetSpreadSuccesses, 0)),
    causalCollapseSuccesses: Math.floor(finite(raw.causalCollapseSuccesses, 0)),
    signalBuffExpiresAt: (() => {
      const stored = isRecord(raw.signalBuffExpiresAt) ? raw.signalBuffExpiresAt : {};
      const result = { ...initial.signalBuffExpiresAt };
      for (const id of ['productionSurge', 'precisionAssist', 'signalBeacon'] as SignalBuffId[]) result[id] = finite(stored[id], 0);
      return result;
    })(),
    directiveProgress: (() => {
      const stored = isRecord(raw.directiveProgress) ? raw.directiveProgress : {};
      const result = { ...initial.directiveProgress };
      for (const id of ['manualCalibration', 'procurementOrder', 'signalCapture'] as DirectiveId[]) result[id] = Math.floor(finite(stored[id], 0));
      return result;
    })(),
    directiveCompletions: (() => {
      const stored = isRecord(raw.directiveCompletions) ? raw.directiveCompletions : {};
      const result = { ...initial.directiveCompletions };
      for (const id of ['manualCalibration', 'procurementOrder', 'signalCapture'] as DirectiveId[]) result[id] = Math.floor(finite(stored[id], 0));
      return result;
    })(),
    optimizationCores: Math.floor(finite(raw.optimizationCores, 0)),
    rebootCount: Math.floor(finite(raw.rebootCount, 0)),
  };
  if (!hasStoredPhaseRewards) markReachedPhaseRewardsGranted(state);
  return state;
}

export function loadGame(now = Date.now()): LoadResult {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: createInitialState(now), offlineSeconds: 0, offlineClips: 0, recovered: false };
    const state = normalize(JSON.parse(raw), now);
    const elapsed = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (now - state.lastSavedAt) / 1000));
    const offlineClips = produceForDuration(state, elapsed);
    state.lastSavedAt = now;
    return { state, offlineSeconds: elapsed, offlineClips, recovered: false };
  } catch {
    return { state: createInitialState(now), offlineSeconds: 0, offlineClips: 0, recovered: true };
  }
}

export function saveGame(state: GameState, now = Date.now()): boolean {
  try {
    state.lastSavedAt = now;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}
