import type { GameState, MachineId, PurchaseMode, UpgradeId } from '../state';
import { MACHINES, getMachine, getUpgrade } from './definitions';
import { milestoneStatus } from './milestones';
import { achievementProductionMultiplier } from './achievements';
import { signalClickMultiplier, signalEquipmentMultiplier } from './signalLab';
import { rebootMultiplier } from './reboot';
import { comboMultiplier } from './combo';
import { overclockMultiplier } from './overclock';
import { catalystMultiplier } from './catalyst';

export function machinePrice(state: GameState, id: MachineId): number {
  const machine = getMachine(id);
  return Math.ceil(machine.basePrice * 1.15 ** state.machines[id]);
}

export function clickProduction(state: GameState): number {
  let amount = 1;
  if (state.upgrades.includes('preciseFingers')) amount *= 2;
  if (state.upgrades.includes('reinforcedLever')) amount *= 2;
  return amount * signalClickMultiplier(state) * rebootMultiplier(state);
}

export function criticalChance(state: GameState): number {
  return state.upgrades.includes('overloadProtocol') ? 0.1 : 0.05;
}

export function criticalMultiplier(state: GameState): number {
  return state.upgrades.includes('resonanceAmplification') ? 8 : 5;
}

export function productionPerSecond(state: GameState): number {
  return MACHINES.reduce((sum, machine) => sum + machineTotalProduction(state, machine.id), 0);
}

export function machineUnitProduction(state: GameState, id: MachineId): number {
  let multiplier = state.upgrades.includes('selfImprovement') ? 1.5 : 1;
  if (state.upgrades.includes('recursiveMandate')) multiplier *= 2;
  if (state.upgrades.includes('causalConvergence')) multiplier *= 2;
  const upgradeByMachine: Partial<Record<MachineId, UpgradeId>> = {
    autoClipper: 'qualityCutter', wireMachine: 'processOptimization', aiLine: 'parallelActuators',
    nanoForge: 'nanoPrecision', swarmAssembler: 'swarmSync', orbitalFoundry: 'orbitalLogistics',
    planetaryAssembler: 'crustalRefinement', stellarHarvester: 'stellarSync', galacticFleet: 'selfReplication',
  };
  const upgrade = upgradeByMachine[id];
  if (upgrade && state.upgrades.includes(upgrade)) multiplier *= 2;
  return getMachine(id).baseProduction * multiplier * milestoneStatus(state.machines[id]).multiplier * achievementProductionMultiplier(state) * signalEquipmentMultiplier(state) * rebootMultiplier(state) * overclockMultiplier(state, id) * catalystMultiplier(state);
}

export function machineTotalProduction(state: GameState, id: MachineId): number {
  return state.machines[id] * machineUnitProduction(state, id);
}

export function produceByClick(state: GameState, combo = 1): { amount: number; critical: boolean } {
  const critical = Math.random() < criticalChance(state);
  const amount = clickProduction(state) * comboMultiplier(combo) * (critical ? criticalMultiplier(state) : 1);
  state.clips += amount;
  state.totalClips += amount;
  return { amount, critical };
}

export function produceForDuration(state: GameState, seconds: number): number {
  const safeSeconds = Math.max(0, seconds);
  const amount = productionPerSecond(state) * safeSeconds;
  state.clips += amount;
  state.totalClips += amount;
  return amount;
}

export function machineBatchPrice(state: GameState, id: MachineId, count: number): number {
  const machine = getMachine(id);
  let total = 0;
  for (let offset = 0; offset < count; offset += 1) {
    total += Math.ceil(machine.basePrice * 1.15 ** (state.machines[id] + offset));
  }
  return total;
}

export function affordableMachineCount(state: GameState, id: MachineId): number {
  let count = 0;
  let spent = 0;
  while (count < 10000) {
    const nextPrice = machineBatchPrice(state, id, count + 1) - spent;
    if (spent + nextPrice > state.clips + Number.EPSILON) break;
    spent += nextPrice;
    count += 1;
  }
  return count;
}

export function selectedPurchase(state: GameState, id: MachineId, mode: PurchaseMode): { count: number; price: number } {
  const count = mode === 'max' ? affordableMachineCount(state, id) : mode;
  return { count, price: count > 0 ? machineBatchPrice(state, id, count) : machinePrice(state, id) };
}

export function buyMachines(state: GameState, id: MachineId, mode: PurchaseMode): number {
  if (!state.unlockedMachines.includes(id)) return 0;
  const purchase = selectedPurchase(state, id, mode);
  if (purchase.count < 1 || state.clips + Number.EPSILON < purchase.price) return 0;
  state.clips -= purchase.price;
  state.machines[id] += purchase.count;
  return purchase.count;
}

export function buyUpgrade(state: GameState, id: UpgradeId): boolean {
  if (state.upgrades.includes(id)) return false;
  const upgrade = getUpgrade(id);
  if (!upgrade.isUnlocked(state) || state.clips + Number.EPSILON < upgrade.price) return false;
  state.clips -= upgrade.price;
  state.upgrades.push(id);
  return true;
}

export function updateUnlocks(state: GameState): MachineId[] {
  const newlyUnlocked: MachineId[] = [];
  for (const machine of MACHINES) {
    if (state.totalClips >= machine.unlockAt && !state.unlockedMachines.includes(machine.id)) {
      state.unlockedMachines.push(machine.id);
      newlyUnlocked.push(machine.id);
    }
  }
  return newlyUnlocked;
}

export function isUpgradeUnlocked(state: GameState, id: UpgradeId): boolean {
  return !state.upgrades.includes(id) && getUpgrade(id).isUnlocked(state);
}

export function isAutoBuyUnlocked(state: GameState): boolean {
  return state.upgrades.includes('autoBuyCore');
}

export function autoBuyTick(state: GameState): MachineId[] {
  if (!isAutoBuyUnlocked(state)) return [];
  const purchased: MachineId[] = [];
  for (const machine of MACHINES) {
    if (!state.autoBuyEnabled[machine.id]) continue;
    if (!state.unlockedMachines.includes(machine.id)) continue;
    if (buyMachines(state, machine.id, 1) > 0) purchased.push(machine.id);
  }
  return purchased;
}
