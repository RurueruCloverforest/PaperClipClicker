import type { GameState, MachineId } from '../state';
import { clickProduction, productionPerSecond } from './clips';

export const PLAYABLE_INTERIOR: MachineId = 'autoClipper';
export const WIRE_INTERIOR: MachineId = 'wireMachine';
export const WIRE_TARGET_WIDTH = 24;
export const WIRE_ROUNDS = 5;
export const WIRE_COOLDOWN_MS = 30_000;
export const FACTORY_INTERIOR: MachineId = 'clipFactory';
export const FACTORY_INSPECTIONS = 8;
export const FACTORY_COOLDOWN_MS = 40_000;
export type FactoryQuality = 'standard' | 'deformed';
export const INTERIOR_SESSION_MS = 18_000;
export const INTERIOR_COOLDOWN_MS = 45_000;
export const INTERIOR_SPAWN_MS = 800;
export const INTERIOR_MAX_LIVE = 3;

export function canOpenInterior(state: GameState, id: MachineId): boolean {
  return state.machines[id] >= 1;
}

export function interiorHarvestAmount(state: GameState): number {
  return Math.max(20, clickProduction(state) * 5, productionPerSecond(state) * 2);
}

export function applyInteriorHarvest(state: GameState): number {
  const amount = interiorHarvestAmount(state);
  state.clips += amount;
  state.totalClips += amount;
  state.interiorHarvests += 1;
  return amount;
}

export function randomInteriorPosition(random = Math.random): { x: number; y: number } {
  return {
    x: 12 + random() * 64,
    y: 18 + random() * 58,
  };
}

export function randomWireTarget(random = Math.random): number {
  return 8 + random() * (84 - WIRE_TARGET_WIDTH);
}

export function wireTensionPosition(elapsedMs: number, periodMs = 2_000): number {
  const phase = ((Math.max(0, elapsedMs) % periodMs) / periodMs) * 2;
  return phase <= 1 ? phase * 100 : (2 - phase) * 100;
}

export function isWireCalibrationSuccess(position: number, targetStart: number): boolean {
  return position >= targetStart && position <= targetStart + WIRE_TARGET_WIDTH;
}

export function wireCalibrationUnitReward(state: GameState): number {
  return Math.max(100, productionPerSecond(state) * 30, clickProduction(state) * 50);
}

export function applyWireCalibrationReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(WIRE_ROUNDS, Math.floor(successes)));
  const amount = wireCalibrationUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.wireCalibrationSuccesses += safeSuccesses;
  return amount;
}

export function factoryInspectionBatch(random = Math.random): FactoryQuality[] {
  const batch: FactoryQuality[] = ['standard', 'standard', 'standard', 'standard', 'deformed', 'deformed', 'deformed', 'deformed'];
  for (let index = batch.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [batch[index], batch[swap]] = [batch[swap]!, batch[index]!];
  }
  return batch;
}

export function factoryQualityUnitReward(state: GameState): number {
  return Math.max(500, productionPerSecond(state) * 45, clickProduction(state) * 100);
}

export function applyFactoryQualityReward(state: GameState, correct: number): number {
  const safeCorrect = Math.max(0, Math.min(FACTORY_INSPECTIONS, Math.floor(correct)));
  const amount = factoryQualityUnitReward(state) * safeCorrect;
  state.clips += amount;
  state.totalClips += amount;
  state.factoryQualityCorrect += safeCorrect;
  return amount;
}

export const TRACE_INTERIOR: MachineId = 'aiLine';
export const TRACE_ROUNDS = 4;
export const TRACE_LENGTHS = [3, 3, 4, 4] as const;
export const TRACE_COOLDOWN_MS = 45_000;
export const TRACE_STEP_MS = 420;
export const TRACE_RESULT_MS = 700;
export const TRACE_REDUCED_OBSERVE_MS = 1_600;
export type TraceNodeId = 0 | 1 | 2 | 3;
export const TRACE_NODES: TraceNodeId[] = [0, 1, 2, 3];

export function randomTraceSequence(length: number, random = Math.random): TraceNodeId[] {
  const sequence: TraceNodeId[] = [];
  const safeLength = Math.max(1, Math.floor(length));
  for (let index = 0; index < safeLength; index += 1) {
    const previous = sequence.at(-1);
    const options = TRACE_NODES.filter((node) => node !== previous);
    const pick = Math.floor(Math.max(0, Math.min(0.999999, random())) * options.length);
    sequence.push(options[pick]!);
  }
  return sequence;
}

export function isTraceStepCorrect(sequence: TraceNodeId[], index: number, choice: TraceNodeId): boolean {
  return sequence[index] === choice;
}

export function traceUnitReward(state: GameState): number {
  return Math.max(800, productionPerSecond(state) * 55, clickProduction(state) * 120);
}

export function applyTraceReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(TRACE_ROUNDS, Math.floor(successes)));
  const amount = traceUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.traceAiSuccesses += safeSuccesses;
  return amount;
}

export const NANO_INTERIOR: MachineId = 'nanoForge';
export const NANO_ROUNDS = 4;
export const NANO_CELLS = 16;
export const NANO_WASTE = 5;
export const NANO_COOLDOWN_MS = 50_000;
export const NANO_RESULT_MS = 700;

export function randomNanoWaste(random = Math.random): number[] {
  const cells = Array.from({ length: NANO_CELLS }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [cells[index], cells[swap]] = [cells[swap]!, cells[index]!];
  }
  return cells.slice(0, NANO_WASTE).sort((left, right) => left - right);
}

export function isNanoWasteCell(waste: number[], index: number): boolean {
  return waste.includes(index);
}

export function nanoPurgeUnitReward(state: GameState): number {
  return Math.max(1_200, productionPerSecond(state) * 70, clickProduction(state) * 150);
}

export function applyNanoPurgeReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(NANO_ROUNDS, Math.floor(successes)));
  const amount = nanoPurgeUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.nanoPurgeSuccesses += safeSuccesses;
  return amount;
}

export const SWARM_INTERIOR: MachineId = 'swarmAssembler';
export const SWARM_ROUNDS = 4;
export const SWARM_UNITS = 8;
export const SWARM_TARGETS = [3, 4, 5, 3] as const;
export const SWARM_COOLDOWN_MS = 50_000;
export const SWARM_RESULT_MS = 700;

export function swarmTarget(round: number): number {
  return SWARM_TARGETS[Math.min(Math.max(Math.floor(round), 1), SWARM_ROUNDS) - 1] ?? SWARM_TARGETS[0];
}

export function isSwarmSyncSuccess(selectedCount: number, target: number): boolean {
  return selectedCount === target;
}

export function swarmSyncUnitReward(state: GameState): number {
  return Math.max(1_500, productionPerSecond(state) * 80, clickProduction(state) * 180);
}

export function applySwarmSyncReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(SWARM_ROUNDS, Math.floor(successes)));
  const amount = swarmSyncUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.swarmSyncSuccesses += safeSuccesses;
  return amount;
}

export const ORBITAL_INTERIOR: MachineId = 'orbitalFoundry';
export const ORBITAL_ROUNDS = 4;
export const ORBITAL_DOCKS = 8;
export const ORBITAL_BLOCKED = 2;
export const ORBITAL_TARGETS = [3, 4, 3, 4] as const;
export const ORBITAL_COOLDOWN_MS = 55_000;
export const ORBITAL_RESULT_MS = 700;

export function orbitalTarget(round: number): number {
  return ORBITAL_TARGETS[Math.min(Math.max(Math.floor(round), 1), ORBITAL_ROUNDS) - 1] ?? ORBITAL_TARGETS[0];
}

export function longestAvailableRun(blocked: number[], docks = ORBITAL_DOCKS): number {
  const closed = new Set(blocked);
  if (closed.size === 0) return docks;
  let best = 0;
  let current = 0;
  for (let index = 0; index < docks * 2; index += 1) {
    if (closed.has(index % docks)) current = 0;
    else {
      current += 1;
      best = Math.max(best, current);
    }
  }
  return Math.min(best, docks);
}

export function randomOrbitalBlocked(target: number, random = Math.random): number[] {
  const safeTarget = Math.max(1, Math.min(ORBITAL_DOCKS - ORBITAL_BLOCKED, Math.floor(target)));
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const first = Math.floor(Math.max(0, Math.min(0.999999, random())) * ORBITAL_DOCKS);
    let second = Math.floor(Math.max(0, Math.min(0.999999, random())) * ORBITAL_DOCKS);
    if (second === first) second = (first + 1 + Math.floor(Math.max(0, Math.min(0.999999, random())) * (ORBITAL_DOCKS - 1))) % ORBITAL_DOCKS;
    const blocked = [first, second].sort((left, right) => left - right);
    if (new Set(blocked).size === ORBITAL_BLOCKED && longestAvailableRun(blocked) >= safeTarget) return blocked;
  }
  return [0, 1];
}

export function isContiguousArc(selected: boolean[], docks = ORBITAL_DOCKS): boolean {
  const indices = selected.flatMap((on, index) => (on ? [index] : []));
  if (indices.length <= 1) return indices.length === 1;
  if (indices.length === docks) return true;
  const gaps: number[] = [];
  for (let index = 0; index < indices.length - 1; index += 1) gaps.push(indices[index + 1]! - indices[index]!);
  gaps.push(indices[0]! + docks - indices[indices.length - 1]!);
  const ones = gaps.filter((gap) => gap === 1).length;
  return ones === indices.length - 1 && gaps.includes(docks - indices.length + 1);
}

export function isOrbitalBerthSuccess(selected: boolean[], blocked: number[], target: number): boolean {
  if (selected.filter(Boolean).length !== target) return false;
  if (blocked.some((index) => selected[index])) return false;
  return isContiguousArc(selected);
}

export function orbitalBerthUnitReward(state: GameState): number {
  return Math.max(2_000, productionPerSecond(state) * 95, clickProduction(state) * 220);
}

export function applyOrbitalBerthReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(ORBITAL_ROUNDS, Math.floor(successes)));
  const amount = orbitalBerthUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.orbitalBerthSuccesses += safeSuccesses;
  return amount;
}

export const MATTER_INTERIOR: MachineId = 'matterCompiler';
export const MATTER_ROUNDS = 4;
export const MATTER_CELLS = 6;
export const MATTER_PAIRS = 3;
export const MATTER_COOLDOWN_MS = 55_000;
export const MATTER_RESULT_MS = 700;
export const MATTER_TYPES = ['ore', 'dust', 'flux'] as const;
export type MatterKind = (typeof MATTER_TYPES)[number];

export function randomMatterBoard(random = Math.random): MatterKind[] {
  const board: MatterKind[] = ['ore', 'ore', 'dust', 'dust', 'flux', 'flux'];
  for (let index = board.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [board[index], board[swap]] = [board[swap]!, board[index]!];
  }
  return board;
}

export function isMatterPair(board: MatterKind[], first: number, second: number): boolean {
  return first !== second && board[first] !== undefined && board[first] === board[second];
}

export function matterPairsRemaining(compiled: boolean[]): number {
  return Math.max(0, MATTER_PAIRS - Math.floor(compiled.filter(Boolean).length / 2));
}

export function isMatterRoundSuccess(compiled: boolean[]): boolean {
  return compiled.length >= MATTER_CELLS && compiled.slice(0, MATTER_CELLS).every(Boolean);
}

export function matterCompileUnitReward(state: GameState): number {
  return Math.max(2_500, productionPerSecond(state) * 110, clickProduction(state) * 260);
}

export function applyMatterCompileReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(MATTER_ROUNDS, Math.floor(successes)));
  const amount = matterCompileUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.matterCompileSuccesses += safeSuccesses;
  return amount;
}

export const PLANET_INTERIOR: MachineId = 'planetaryAssembler';
export const PLANET_ROUNDS = 4;
export const PLANET_QUADS = 4;
export const PLANET_LENGTHS = [3, 4, 4, 5] as const;
export const PLANET_COOLDOWN_MS = 60_000;
export const PLANET_RESULT_MS = 700;
export type PlanetQuad = 0 | 1 | 2 | 3;
export const PLANET_QUAD_IDS: PlanetQuad[] = [0, 1, 2, 3];

export function planetOrderLength(round: number): number {
  return PLANET_LENGTHS[Math.min(Math.max(Math.floor(round), 1), PLANET_ROUNDS) - 1] ?? PLANET_LENGTHS[0];
}

export function randomPlanetOrder(length: number, random = Math.random): PlanetQuad[] {
  const order: PlanetQuad[] = [];
  const safeLength = Math.max(1, Math.floor(length));
  for (let index = 0; index < safeLength; index += 1) {
    const previous = order.at(-1);
    const options = PLANET_QUAD_IDS.filter((quad) => quad !== previous);
    const pick = Math.floor(Math.max(0, Math.min(0.999999, random())) * options.length);
    order.push(options[pick]!);
  }
  return order;
}

export function isPlanetStepCorrect(order: PlanetQuad[], index: number, choice: PlanetQuad): boolean {
  return order[index] === choice;
}

export function planetStripUnitReward(state: GameState): number {
  return Math.max(3_000, productionPerSecond(state) * 125, clickProduction(state) * 300);
}

export function applyPlanetStripReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(PLANET_ROUNDS, Math.floor(successes)));
  const amount = planetStripUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.planetStripSuccesses += safeSuccesses;
  return amount;
}

export const STELLAR_INTERIOR: MachineId = 'stellarHarvester';
export const STELLAR_ROUNDS = 4;
export const STELLAR_PETALS = 6;
export const STELLAR_COOLDOWN_MS = 60_000;
export const STELLAR_RESULT_MS = 700;

export function randomStellarMask(random = Math.random): boolean[] {
  const openCount = 2 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 3);
  const indices = Array.from({ length: STELLAR_PETALS }, (_, index) => index);
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [indices[index], indices[swap]] = [indices[swap]!, indices[index]!];
  }
  const mask = Array.from({ length: STELLAR_PETALS }, () => false);
  for (let index = 0; index < openCount; index += 1) mask[indices[index]!] = true;
  return mask;
}

export function isStellarSyncSuccess(open: boolean[], target: boolean[]): boolean {
  return open.length === target.length && open.every((on, index) => on === target[index]);
}

export function stellarSyncUnitReward(state: GameState): number {
  return Math.max(3_500, productionPerSecond(state) * 140, clickProduction(state) * 340);
}

export function applyStellarSyncReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(STELLAR_ROUNDS, Math.floor(successes)));
  const amount = stellarSyncUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.stellarSyncSuccesses += safeSuccesses;
  return amount;
}

export const FLEET_INTERIOR: MachineId = 'galacticFleet';
export const FLEET_ROUNDS = 4;
export const FLEET_CELLS = 9;
export const FLEET_COOLDOWN_MS = 60_000;
export const FLEET_RESULT_MS = 700;

export function randomFleetSeed(random = Math.random): number {
  return Math.floor(Math.max(0, Math.min(0.999999, random())) * FLEET_CELLS);
}

export function fleetNeighbors(index: number): number[] {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - 3);
  if (row < 2) neighbors.push(index + 3);
  if (col > 0) neighbors.push(index - 1);
  if (col < 2) neighbors.push(index + 1);
  return neighbors;
}

export function canClaimFleetCell(owned: boolean[], index: number): boolean {
  if (index < 0 || index >= FLEET_CELLS || owned[index]) return false;
  return fleetNeighbors(index).some((neighbor) => owned[neighbor] === true);
}

export function isFleetSpreadSuccess(owned: boolean[]): boolean {
  return owned.length >= FLEET_CELLS && owned.slice(0, FLEET_CELLS).every(Boolean);
}

export function fleetSpreadUnitReward(state: GameState): number {
  return Math.max(4_000, productionPerSecond(state) * 155, clickProduction(state) * 380);
}

export function applyFleetSpreadReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(FLEET_ROUNDS, Math.floor(successes)));
  const amount = fleetSpreadUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.fleetSpreadSuccesses += safeSuccesses;
  return amount;
}

export const CAUSAL_INTERIOR: MachineId = 'causalOptimizer';
export const CAUSAL_ROUNDS = 4;
export const CAUSAL_GAUGES = 4;
export const CAUSAL_MOD = 4;
export const CAUSAL_COOLDOWN_MS = 60_000;
export const CAUSAL_RESULT_MS = 700;

export function isCausalConverged(values: number[]): boolean {
  if (values.length < CAUSAL_GAUGES) return false;
  const first = values[0];
  return values.slice(0, CAUSAL_GAUGES).every((value) => value === first);
}

export function causalSpan(values: number[]): number {
  const slice = values.slice(0, CAUSAL_GAUGES);
  if (slice.length === 0) return 0;
  return Math.max(...slice) - Math.min(...slice);
}

export function randomCausalGauges(random = Math.random): number[] {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const values = Array.from({ length: CAUSAL_GAUGES }, () => Math.floor(Math.max(0, Math.min(0.999999, random())) * CAUSAL_MOD));
    if (!isCausalConverged(values)) return values;
  }
  return [0, 1, 2, 3];
}

export function incrementCausalGauge(values: number[], index: number): number[] {
  const next = values.slice(0, CAUSAL_GAUGES);
  while (next.length < CAUSAL_GAUGES) next.push(0);
  if (index < 0 || index >= CAUSAL_GAUGES) return next;
  next[index] = ((next[index] ?? 0) + 1) % CAUSAL_MOD;
  return next;
}

export function causalCollapseUnitReward(state: GameState): number {
  return Math.max(4_500, productionPerSecond(state) * 170, clickProduction(state) * 420);
}

export function applyCausalCollapseReward(state: GameState, successes: number): number {
  const safeSuccesses = Math.max(0, Math.min(CAUSAL_ROUNDS, Math.floor(successes)));
  const amount = causalCollapseUnitReward(state) * safeSuccesses;
  state.clips += amount;
  state.totalClips += amount;
  state.causalCollapseSuccesses += safeSuccesses;
  return amount;
}
