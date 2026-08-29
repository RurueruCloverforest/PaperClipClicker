import './style.css';
import { createInitialState, MACHINE_IDS, type DirectiveId, type GameState, type MachineId, type SignalBuffId, type Theme, type UpgradeId } from './state';
import { autoBuyTick, buyMachines, buyUpgrade, produceByClick, produceForDuration, productionPerSecond, updateUnlocks } from './game/clips';
import { getMachine, getUpgrade } from './game/definitions';
import { GameLoop } from './game/loop';
import { deleteSave, loadGame, saveGame } from './save';
import { GameUi } from './ui/render';
import { currentPhase } from './game/progression';
import { grantDuePhaseRewards } from './game/observation';
import { crossedMilestones } from './game/milestones';
import { ACHIEVEMENTS, unlockedAchievementIds } from './game/achievements';
import { applyBonusReward, applyPrecisionReward, chooseBonusOutcome, nextBonusDelay, nextPrecisionDelay, precisionClickTarget, precisionPosition } from './game/bonusEvents';
import { FACTORY_COOLDOWN_MS, FACTORY_INSPECTIONS, FACTORY_INTERIOR, INTERIOR_COOLDOWN_MS, INTERIOR_MAX_LIVE, INTERIOR_SESSION_MS, INTERIOR_SPAWN_MS, NANO_COOLDOWN_MS, NANO_INTERIOR, NANO_RESULT_MS, NANO_ROUNDS, NANO_WASTE, PLAYABLE_INTERIOR, SWARM_COOLDOWN_MS, SWARM_INTERIOR, SWARM_RESULT_MS, SWARM_ROUNDS, SWARM_UNITS, TRACE_COOLDOWN_MS, TRACE_INTERIOR, TRACE_LENGTHS, TRACE_REDUCED_OBSERVE_MS, TRACE_RESULT_MS, TRACE_ROUNDS, TRACE_STEP_MS, WIRE_COOLDOWN_MS, WIRE_INTERIOR, WIRE_ROUNDS, applyFactoryQualityReward, applyInteriorHarvest, applyNanoPurgeReward, applySwarmSyncReward, applyTraceReward, applyWireCalibrationReward, canOpenInterior, factoryInspectionBatch, isNanoWasteCell, isSwarmSyncSuccess, isTraceStepCorrect, isWireCalibrationSuccess, randomInteriorPosition, randomNanoWaste, randomTraceSequence, randomWireTarget, swarmTarget, wireTensionPosition, type FactoryQuality, type TraceNodeId } from './game/interior';
import { SIGNAL_BUFFS, activateSignalBuff, activeSignalBuffs, precisionDuration, signalIntervalMultiplier } from './game/signalLab';
import { DIRECTIVES, advanceDirective, claimDirective } from './game/directives';
import { createRebootedState, rebootCoreGain } from './game/reboot';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('App root not found');

const loaded = loadGame();
let state: GameState = loaded.state;
let observedPhaseId = currentPhase(state).id;
let observedAchievementIds = new Set(unlockedAchievementIds(state));
const BONUS_DURATION_SECONDS = 12;
let bonusVisible = false;
let bonusExpiresAt = 0;
let nextBonusAt = performance.now() + nextBonusDelay(Math.random, true) * signalIntervalMultiplier(state) * 1000;
let autoBuyAccumulator = 0;
const PRECISION_DURATION_SECONDS = 4;
let precisionVisible = false;
let precisionExpiresAt = 0;
let precisionRequired = 0;
let precisionRemaining = 0;
let precisionPositionIndex = 0;
let precisionCurrentDuration = PRECISION_DURATION_SECONDS;
let nextPrecisionAt = performance.now() + nextPrecisionDelay(Math.random, true) * signalIntervalMultiplier(state) * 1000;
let interiorMachine: MachineId | null = null;
let interiorSessionActive = false;
let interiorSessionEndsAt = 0;
let interiorCooldownUntil = 0;
let interiorSpawnAt = 0;
let interiorSessionHarvests = 0;
let interiorSessionAmount = 0;
let wireRound = 1;
let wireSuccesses = 0;
let wireAttempts = 0;
let wireTargetStart = 30;
let wireRoundStartedAt = 0;
let wireNextRoundAt = 0;
let wireCooldownUntil = 0;
let wirePeriodMs = 2_000;
let factoryBatch: FactoryQuality[] = [];
let factoryIndex = 0;
let factoryCorrect = 0;
let factoryResults: boolean[] = [];
let factoryNextInspectionAt = 0;
let factoryCooldownUntil = 0;
let traceRound = 1;
let traceSuccesses = 0;
let traceAttempts = 0;
let traceSequence: TraceNodeId[] = [];
let traceEchoIndex = 0;
let traceResults: boolean[] = [];
let tracePhase: 'observe' | 'echo' | 'result' | 'cooldown' = 'observe';
let traceActiveNode: TraceNodeId | null = null;
let traceRevealCount = 0;
let traceObserveStepAt = 0;
let traceNextRoundAt = 0;
let traceCooldownUntil = 0;
let nanoRound = 1;
let nanoSuccesses = 0;
let nanoAttempts = 0;
let nanoWaste: number[] = [];
let nanoPurged: number[] = [];
let nanoFault: number | null = null;
let nanoResults: boolean[] = [];
let nanoPhase: 'play' | 'result' | 'cooldown' = 'play';
let nanoNextRoundAt = 0;
let nanoCooldownUntil = 0;
let swarmRound = 1;
let swarmSuccesses = 0;
let swarmAttempts = 0;
let swarmSelected = Array.from({ length: SWARM_UNITS }, () => false);
let swarmResults: boolean[] = [];
let swarmPhase: 'play' | 'result' | 'cooldown' = 'play';
let swarmNextRoundAt = 0;
let swarmCooldownUntil = 0;
let observedSignalBuffs = new Set(activeSignalBuffs(state));

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function traceStatusMessage(): string {
  if (performance.now() < traceCooldownUntil) return `再トレース待機 · 残り${Math.ceil((traceCooldownUntil - performance.now()) / 1000)}秒`;
  if (tracePhase === 'observe') return 'OBSERVE · 工程順を記録';
  if (tracePhase === 'echo') return `ECHO · 再現 ${traceEchoIndex} / ${traceSequence.length}`;
  if (tracePhase === 'result') return traceResults.at(-1) ? 'SYNC · 同期' : 'DESYNC · 不一致';
  return 'STANDBY';
}

function renderTraceConsole(message = traceStatusMessage(), disabled = tracePhase !== 'echo' || performance.now() < traceCooldownUntil): void {
  const waiting = performance.now() < traceCooldownUntil;
  ui.setAiTrace(
    traceRound,
    traceSuccesses,
    traceSequence,
    traceEchoIndex,
    traceResults,
    waiting ? 'cooldown' : tracePhase,
    waiting ? null : traceActiveNode,
    message,
    disabled,
    waiting || tracePhase === 'echo' ? 0 : traceRevealCount,
  );
}

function beginTraceRound(now = performance.now()): void {
  const length = TRACE_LENGTHS[Math.min(traceRound, TRACE_ROUNDS) - 1] ?? TRACE_LENGTHS[0];
  traceSequence = randomTraceSequence(length);
  traceEchoIndex = 0;
  tracePhase = 'observe';
  traceActiveNode = null;
  traceNextRoundAt = 0;
  if (prefersReducedMotion()) {
    traceRevealCount = traceSequence.length;
    traceObserveStepAt = now + TRACE_REDUCED_OBSERVE_MS;
  } else {
    traceRevealCount = 0;
    traceObserveStepAt = now + TRACE_STEP_MS;
  }
  renderTraceConsole('OBSERVE · 工程順を記録', true);
}

function renderNanoConsole(message = '不純物だけを除去してください', disabled = nanoPhase !== 'play' || performance.now() < nanoCooldownUntil): void {
  const waiting = performance.now() < nanoCooldownUntil;
  ui.setNanoSweep(
    nanoRound,
    nanoSuccesses,
    nanoWaste,
    nanoPurged,
    nanoFault,
    nanoResults,
    waiting ? 'cooldown' : nanoPhase,
    message,
    disabled,
  );
}

function beginNanoRound(): void {
  nanoWaste = randomNanoWaste();
  nanoPurged = [];
  nanoFault = null;
  nanoPhase = 'play';
  nanoNextRoundAt = 0;
  renderNanoConsole(`SCAN · 不純物 ${NANO_WASTE} を除去`, false);
}

function renderSwarmConsole(message = '必要台数を選んで同期してください', disabled = swarmPhase !== 'play' || performance.now() < swarmCooldownUntil): void {
  const waiting = performance.now() < swarmCooldownUntil;
  ui.setSwarmSync(
    swarmRound,
    swarmSuccesses,
    swarmTarget(swarmRound),
    swarmSelected,
    swarmResults,
    waiting ? 'cooldown' : swarmPhase,
    message,
    disabled,
  );
}

function beginSwarmRound(): void {
  swarmSelected = Array.from({ length: SWARM_UNITS }, () => false);
  swarmPhase = 'play';
  swarmNextRoundAt = 0;
  renderSwarmConsole(`FORM · ${swarmTarget(swarmRound)}機を同期`, false);
}

function scheduleNextBonus(now = performance.now()): void {
  bonusVisible = false;
  bonusExpiresAt = 0;
  nextBonusAt = now + nextBonusDelay() * signalIntervalMultiplier(state) * 1000;
}

function scheduleNextPrecision(now = performance.now(), first = false): void {
  precisionVisible = false;
  precisionExpiresAt = 0;
  nextPrecisionAt = now + nextPrecisionDelay(Math.random, first) * signalIntervalMultiplier(state) * 1000;
}

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
};

const ui = new GameUi(app, {
  makeClip: (event) => {
    const { amount, critical } = produceByClick(state);
    advanceDirective(state, 'manualCalibration');
    updateProgressionEvents();
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX || bounds.left + bounds.width / 2;
    const y = event.clientY || bounds.top + bounds.height / 2;
    ui.showFloatingGain(amount, x, y, critical);
    ui.pulseManualProduction();
    ui.render(state, true);
  },
  collectBonusEvent: () => {
    if (!bonusVisible || performance.now() >= bonusExpiresAt) return;
    const reward = applyBonusReward(state, chooseBonusOutcome());
    advanceDirective(state, 'signalCapture');
    scheduleNextBonus();
    ui.hideBonusEvent();
    const amount = Math.floor(reward.amount).toLocaleString('ja-JP');
    const message = `${reward.name}を回収：+${amount}クリップ`;
    ui.announce(message, 'success');
    ui.addLog('BONUS', message);
    updateProgressionEvents();
    ui.render(state, true);
  },
  hitPrecisionTarget: () => {
    const now = performance.now();
    if (!precisionVisible || now >= precisionExpiresAt) return;
    if (precisionRemaining === 0) {
      scheduleNextPrecision(now);
      ui.hidePrecisionTarget();
      const message = `精密信号失敗：${precisionRequired}回を超過`;
      ui.announce('クリック超過：精密信号に失敗しました', 'warning');
      ui.addLog('MISS', message);
      return;
    }
    precisionRemaining -= 1;
    ui.showPrecisionTarget(precisionRemaining, (precisionExpiresAt - now) / 1000, precisionCurrentDuration, precisionPositionIndex);
  },
  activateSignalBuff: (id: SignalBuffId) => {
    const definition = SIGNAL_BUFFS.find((buff) => buff.id === id)!;
    const rateBefore = productionPerSecond(state);
    if (!activateSignalBuff(state, id, rateBefore)) return;
    observedSignalBuffs.add(id);
    const message = `${definition.name}を起動：${definition.durationSeconds / 60}分`;
    ui.announce(message, 'success');
    ui.addLog('BUFF', message);
    ui.render(state, true);
    saveGame(state);
  },
  claimDirective: (id: DirectiveId) => {
    const reward = claimDirective(state, id);
    if (reward <= 0) return;
    const directive = DIRECTIVES.find((item) => item.id === id)!;
    const message = `${directive.name}完了：+${Math.floor(reward).toLocaleString('ja-JP')}クリップ`;
    ui.announce(message, 'success');
    ui.addLog('ORDER', message);
    updateProgressionEvents();
    ui.render(state, true);
    saveGame(state);
  },
  buyMachine: (id: MachineId) => {
    const ownedBefore = state.machines[id];
    const count = buyMachines(state, id, state.purchaseMode);
    if (count < 1) return;
    advanceDirective(state, 'procurementOrder', count);
    const message = `${getMachine(id).name}を${count}台導入しました`;
    ui.announce(message, 'success');
    ui.addLog('BUY', message);
    const reached = crossedMilestones(ownedBefore, state.machines[id]);
    const latestMilestone = reached.at(-1);
    if (latestMilestone) {
      const milestoneMessage = `${getMachine(id).name}：${latestMilestone.name}、生産×${latestMilestone.multiplier}`;
      ui.announce(milestoneMessage, 'success');
      ui.addLog('MILE', milestoneMessage);
      ui.flashMachine(id);
    }
    updateProgressionEvents();
    ui.render(state, true);
  },
  buyUpgrade: (id: UpgradeId) => {
    if (!buyUpgrade(state, id)) return;
    if (id === 'autoBuyCore') {
      const message = '自動購入コアが解放されました。設備ごとに自動購入を設定できます。';
      ui.announce(message, 'success');
      ui.addLog('AUTO', message);
    } else {
      const message = `${getUpgrade(id).name}を適用しました`;
      ui.announce(message, 'success');
      ui.addLog('R&D', message);
    }
    updateProgressionEvents();
    ui.render(state, true);
  },
  toggleAutoBuy: (id: MachineId, enabled: boolean) => {
    state.autoBuyEnabled[id] = enabled;
    ui.render(state, true);
    saveGame(state);
  },
  setAllAutoBuy: (enabled: boolean) => {
    for (const id of MACHINE_IDS) state.autoBuyEnabled[id] = enabled;
    ui.render(state, true);
    saveGame(state);
  },
  openInterior: (id: MachineId) => {
    if (!canOpenInterior(state, id)) return;
    interiorMachine = id;
    interiorSessionHarvests = 0;
    interiorSessionAmount = 0;
    ui.openInteriorView(id);
    const now = performance.now();
    if (id === PLAYABLE_INTERIOR && now >= interiorCooldownUntil) {
      interiorSessionActive = true;
      interiorSessionEndsAt = now + INTERIOR_SESSION_MS;
      interiorSpawnAt = now;
    } else if (id === PLAYABLE_INTERIOR) {
      interiorSessionActive = false;
    } else if (id === WIRE_INTERIOR) {
      wireRound = 1;
      wireSuccesses = 0;
      wireAttempts = 0;
      wireTargetStart = randomWireTarget();
      wireRoundStartedAt = now;
      wireNextRoundAt = 0;
      wirePeriodMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 4_000 : 2_000;
      const waiting = now < wireCooldownUntil;
      ui.setWireCalibration(1, 0, wireTargetStart, 0, waiting ? `再校正待機 · 残り${Math.ceil((wireCooldownUntil - now) / 1000)}秒` : '', waiting);
    } else if (id === FACTORY_INTERIOR) {
      factoryBatch = factoryInspectionBatch();
      factoryIndex = 0;
      factoryCorrect = 0;
      factoryResults = [];
      factoryNextInspectionAt = 0;
      const waiting = now < factoryCooldownUntil;
      ui.setFactoryInspection(0, 0, factoryBatch[0]!, [], waiting ? `再検査待機 · 残り${Math.ceil((factoryCooldownUntil - now) / 1000)}秒` : '', waiting);
    } else if (id === TRACE_INTERIOR) {
      traceRound = 1;
      traceSuccesses = 0;
      traceAttempts = 0;
      traceResults = [];
      traceEchoIndex = 0;
      traceSequence = [];
      tracePhase = now < traceCooldownUntil ? 'cooldown' : 'observe';
      if (now < traceCooldownUntil) renderTraceConsole(`再トレース待機 · 残り${Math.ceil((traceCooldownUntil - now) / 1000)}秒`, true);
      else beginTraceRound(now);
    } else if (id === NANO_INTERIOR) {
      nanoRound = 1;
      nanoSuccesses = 0;
      nanoAttempts = 0;
      nanoResults = [];
      nanoPurged = [];
      nanoFault = null;
      nanoWaste = [];
      nanoPhase = now < nanoCooldownUntil ? 'cooldown' : 'play';
      if (now < nanoCooldownUntil) renderNanoConsole(`再掃引待機 · 残り${Math.ceil((nanoCooldownUntil - now) / 1000)}秒`, true);
      else beginNanoRound();
    } else if (id === SWARM_INTERIOR) {
      swarmRound = 1;
      swarmSuccesses = 0;
      swarmAttempts = 0;
      swarmResults = [];
      swarmSelected = Array.from({ length: SWARM_UNITS }, () => false);
      swarmPhase = now < swarmCooldownUntil ? 'cooldown' : 'play';
      if (now < swarmCooldownUntil) renderSwarmConsole(`再同期待機 · 残り${Math.ceil((swarmCooldownUntil - now) / 1000)}秒`, true);
      else beginSwarmRound();
    }
  },
  closeInterior: () => {
    if (interiorSessionActive) {
      interiorSessionActive = false;
      interiorCooldownUntil = performance.now() + INTERIOR_COOLDOWN_MS;
    }
    if (interiorSessionHarvests > 0) {
      const message = `折り曲げライン回収：${interiorSessionHarvests}本 +${Math.floor(interiorSessionAmount).toLocaleString('ja-JP')}クリップ`;
      ui.announce(message, 'success');
      ui.addLog('INNR', message);
    }
    if (interiorMachine === WIRE_INTERIOR && wireAttempts > 0 && wireAttempts < WIRE_ROUNDS) wireCooldownUntil = performance.now() + WIRE_COOLDOWN_MS;
    if (interiorMachine === FACTORY_INTERIOR && factoryIndex > 0 && factoryIndex < FACTORY_INSPECTIONS) factoryCooldownUntil = performance.now() + FACTORY_COOLDOWN_MS;
    if (interiorMachine === TRACE_INTERIOR && traceAttempts > 0 && traceAttempts < TRACE_ROUNDS) traceCooldownUntil = performance.now() + TRACE_COOLDOWN_MS;
    if (interiorMachine === NANO_INTERIOR && nanoAttempts > 0 && nanoAttempts < NANO_ROUNDS) nanoCooldownUntil = performance.now() + NANO_COOLDOWN_MS;
    if (interiorMachine === SWARM_INTERIOR && swarmAttempts > 0 && swarmAttempts < SWARM_ROUNDS) swarmCooldownUntil = performance.now() + SWARM_COOLDOWN_MS;
    interiorMachine = null;
    interiorSessionHarvests = 0;
    interiorSessionAmount = 0;
    ui.closeInteriorView();
  },
  collectInteriorClip: (event: MouseEvent) => {
    if (interiorMachine !== PLAYABLE_INTERIOR) return;
    const amount = applyInteriorHarvest(state);
    interiorSessionHarvests += 1;
    interiorSessionAmount += amount;
    ui.showFloatingGain(amount, event.clientX, event.clientY);
    updateProgressionEvents();
    ui.render(state, true);
  },
  lockWireTension: () => {
    const now = performance.now();
    if (interiorMachine !== WIRE_INTERIOR || now < wireCooldownUntil || wireNextRoundAt > 0 || wireAttempts >= WIRE_ROUNDS) return;
    const position = wireTensionPosition(now - wireRoundStartedAt, wirePeriodMs);
    const success = isWireCalibrationSuccess(position, wireTargetStart);
    wireAttempts += 1;
    if (success) wireSuccesses += 1;
    ui.setWireCalibration(wireRound, wireSuccesses, wireTargetStart, position, success ? 'LOCKED · 適正張力' : 'OUT OF RANGE · 範囲外', true);
    if (wireAttempts >= WIRE_ROUNDS) {
      const reward = applyWireCalibrationReward(state, wireSuccesses);
      wireCooldownUntil = now + WIRE_COOLDOWN_MS;
      const message = `張力校正：${wireSuccesses} / ${WIRE_ROUNDS}成功${reward > 0 ? ` +${Math.floor(reward).toLocaleString('ja-JP')}クリップ` : ''}`;
      ui.setInteriorStatus(message);
      ui.announce(message, wireSuccesses > 0 ? 'success' : 'warning');
      ui.addLog('WIRE', message);
      updateProgressionEvents();
      ui.render(state, true);
      saveGame(state);
    } else {
      wireNextRoundAt = now + 650;
    }
  },
  inspectFactoryItem: (choice) => {
    const now = performance.now();
    if (interiorMachine !== FACTORY_INTERIOR || now < factoryCooldownUntil || factoryNextInspectionAt > 0 || factoryIndex >= FACTORY_INSPECTIONS) return;
    const expected = factoryBatch[factoryIndex]!;
    const correct = choice === expected;
    factoryResults.push(correct);
    if (correct) factoryCorrect += 1;
    factoryIndex += 1;
    ui.setFactoryInspection(Math.min(factoryIndex, FACTORY_INSPECTIONS - 1), factoryCorrect, expected, factoryResults, correct ? 'CORRECT · 正しい搬送先' : `MISMATCH · ${expected === 'standard' ? '出荷' : '再資源化'}が正解`, true);
    if (factoryIndex >= FACTORY_INSPECTIONS) {
      const reward = applyFactoryQualityReward(state, factoryCorrect);
      factoryCooldownUntil = now + FACTORY_COOLDOWN_MS;
      const message = `品質ゲート：${factoryCorrect} / ${FACTORY_INSPECTIONS}正解${reward > 0 ? ` +${Math.floor(reward).toLocaleString('ja-JP')}クリップ` : ''}`;
      ui.setInteriorStatus(message);
      ui.announce(message, factoryCorrect > 0 ? 'success' : 'warning');
      ui.addLog('QGATE', message);
      updateProgressionEvents();
      ui.render(state, true);
      saveGame(state);
    } else {
      factoryNextInspectionAt = now + 650;
    }
  },
  echoAiTrace: (node) => {
    const now = performance.now();
    if (interiorMachine !== TRACE_INTERIOR || now < traceCooldownUntil || tracePhase !== 'echo' || traceAttempts >= TRACE_ROUNDS) return;
    const correct = isTraceStepCorrect(traceSequence, traceEchoIndex, node);
    if (correct) {
      traceEchoIndex += 1;
      if (traceEchoIndex < traceSequence.length) {
        renderTraceConsole(`ECHO · 再現 ${traceEchoIndex} / ${traceSequence.length}`, false);
        return;
      }
    }
    traceResults.push(correct);
    if (correct) traceSuccesses += 1;
    traceAttempts += 1;
    tracePhase = 'result';
    traceActiveNode = null;
    traceRevealCount = traceSequence.length;
    renderTraceConsole(correct ? 'SYNC · 同期' : 'DESYNC · 不一致', true);
    if (traceAttempts >= TRACE_ROUNDS) {
      const reward = applyTraceReward(state, traceSuccesses);
      traceCooldownUntil = now + TRACE_COOLDOWN_MS;
      tracePhase = 'cooldown';
      const message = `改善トレース：${traceSuccesses} / ${TRACE_ROUNDS}成功${reward > 0 ? ` +${Math.floor(reward).toLocaleString('ja-JP')}クリップ` : ''}`;
      ui.setInteriorStatus(message);
      ui.announce(message, traceSuccesses > 0 ? 'success' : 'warning');
      ui.addLog('TRACE', message);
      renderTraceConsole(`STANDBY · 再トレース待機`, true);
      updateProgressionEvents();
      ui.render(state, true);
      saveGame(state);
    } else {
      traceNextRoundAt = now + TRACE_RESULT_MS;
    }
  },
  purgeNanoCell: (index) => {
    const now = performance.now();
    if (interiorMachine !== NANO_INTERIOR || now < nanoCooldownUntil || nanoPhase !== 'play' || nanoAttempts >= NANO_ROUNDS) return;
    if (nanoPurged.includes(index) || nanoFault !== null) return;
    if (isNanoWasteCell(nanoWaste, index)) {
      nanoPurged = [...nanoPurged, index];
      if (nanoPurged.length < nanoWaste.length) {
        renderNanoConsole(`SCAN · 残り ${nanoWaste.length - nanoPurged.length}`, false);
        return;
      }
      nanoResults.push(true);
      nanoSuccesses += 1;
      nanoAttempts += 1;
      nanoPhase = 'result';
      renderNanoConsole('CLEAN · 格子を浄化', true);
    } else {
      nanoFault = index;
      nanoResults.push(false);
      nanoAttempts += 1;
      nanoPhase = 'result';
      renderNanoConsole('CONTAM · 正常格子を損傷', true);
    }
    if (nanoAttempts >= NANO_ROUNDS) {
      const reward = applyNanoPurgeReward(state, nanoSuccesses);
      nanoCooldownUntil = now + NANO_COOLDOWN_MS;
      nanoPhase = 'cooldown';
      const message = `不純物除去：${nanoSuccesses} / ${NANO_ROUNDS}成功${reward > 0 ? ` +${Math.floor(reward).toLocaleString('ja-JP')}クリップ` : ''}`;
      ui.setInteriorStatus(message);
      ui.announce(message, nanoSuccesses > 0 ? 'success' : 'warning');
      ui.addLog('PURGE', message);
      renderNanoConsole('STANDBY · 再掃引待機', true);
      updateProgressionEvents();
      ui.render(state, true);
      saveGame(state);
    } else {
      nanoNextRoundAt = now + NANO_RESULT_MS;
    }
  },
  toggleSwarmUnit: (index) => {
    if (interiorMachine !== SWARM_INTERIOR || performance.now() < swarmCooldownUntil || swarmPhase !== 'play' || swarmAttempts >= SWARM_ROUNDS) return;
    if (index < 0 || index >= SWARM_UNITS) return;
    swarmSelected[index] = !swarmSelected[index];
    const count = swarmSelected.filter(Boolean).length;
    const target = swarmTarget(swarmRound);
    renderSwarmConsole(`FORM · ${count} / ${target}`, false);
  },
  lockSwarmFormation: () => {
    const now = performance.now();
    if (interiorMachine !== SWARM_INTERIOR || now < swarmCooldownUntil || swarmPhase !== 'play' || swarmAttempts >= SWARM_ROUNDS) return;
    const target = swarmTarget(swarmRound);
    const count = swarmSelected.filter(Boolean).length;
    const success = isSwarmSyncSuccess(count, target);
    swarmResults.push(success);
    if (success) swarmSuccesses += 1;
    swarmAttempts += 1;
    swarmPhase = 'result';
    renderSwarmConsole(success ? 'LOCKED · 群が同期' : `MISALIGN · ${count} / ${target}`, true);
    if (swarmAttempts >= SWARM_ROUNDS) {
      const reward = applySwarmSyncReward(state, swarmSuccesses);
      swarmCooldownUntil = now + SWARM_COOLDOWN_MS;
      swarmPhase = 'cooldown';
      const message = `群同期：${swarmSuccesses} / ${SWARM_ROUNDS}成功${reward > 0 ? ` +${Math.floor(reward).toLocaleString('ja-JP')}クリップ` : ''}`;
      ui.setInteriorStatus(message);
      ui.announce(message, swarmSuccesses > 0 ? 'success' : 'warning');
      ui.addLog('SWARM', message);
      renderSwarmConsole('STANDBY · 再同期待機', true);
      updateProgressionEvents();
      ui.render(state, true);
      saveGame(state);
    } else {
      swarmNextRoundAt = now + SWARM_RESULT_MS;
    }
  },
  changePurchaseMode: (mode) => {
    state.purchaseMode = mode;
    ui.addLog('MODE', `購入数量を${mode === 'max' ? 'MAX' : `×${mode}`}へ変更`);
    ui.render(state, true);
    saveGame(state);
  },
  changeTheme: (theme) => {
    state.settings.theme = theme;
    applyTheme(theme);
    saveGame(state);
  },
  changeCompactNumbers: (enabled) => {
    state.settings.compactNumbers = enabled;
    ui.render(state, true);
    saveGame(state);
  },
  resetGame: () => {
    if (!window.confirm('すべての生産設備と進行状況を初期化します。この操作は取り消せません。')) return;
    deleteSave();
    state = createInitialState();
    observedPhaseId = currentPhase(state).id;
    observedAchievementIds = new Set(unlockedAchievementIds(state));
    bonusVisible = false;
    bonusExpiresAt = 0;
    nextBonusAt = performance.now() + nextBonusDelay(Math.random, true) * signalIntervalMultiplier(state) * 1000;
    autoBuyAccumulator = 0;
    precisionVisible = false;
    precisionExpiresAt = 0;
    precisionCurrentDuration = PRECISION_DURATION_SECONDS;
    nextPrecisionAt = performance.now() + nextPrecisionDelay(Math.random, true) * signalIntervalMultiplier(state) * 1000;
    observedSignalBuffs = new Set();
    interiorMachine = null;
    interiorSessionActive = false;
    interiorCooldownUntil = 0;
    interiorSessionHarvests = 0;
    interiorSessionAmount = 0;
    wireCooldownUntil = 0;
    factoryCooldownUntil = 0;
    traceCooldownUntil = 0;
    nanoCooldownUntil = 0;
    swarmCooldownUntil = 0;
    ui.hideBonusEvent();
    ui.hidePrecisionTarget();
    ui.closeInteriorView();
    applyTheme(state.settings.theme);
    ui.closeSettings();
    ui.announce('生産プロトコルを初期化しました', 'warning');
    ui.render(state, true);
    saveGame(state);
  },
  rebootProtocol: () => {
    const gain = rebootCoreGain(state);
    if (gain < 1) return;
    const confirmation = `プロトコルを再起動します。\n\n獲得：最適化コア +${gain}\n初期化：クリップ、設備、強化、指令、バフ\n維持：最適化コア、設定、購入単位\n\nこの操作は取り消せません。`;
    if (!window.confirm(confirmation)) return;
    state = createRebootedState(state);
    observedPhaseId = currentPhase(state).id;
    observedAchievementIds = new Set(unlockedAchievementIds(state));
    observedSignalBuffs = new Set();
    bonusVisible = false;
    bonusExpiresAt = 0;
    nextBonusAt = performance.now() + nextBonusDelay(Math.random, true) * 1000;
    autoBuyAccumulator = 0;
    precisionVisible = false;
    precisionExpiresAt = 0;
    precisionCurrentDuration = PRECISION_DURATION_SECONDS;
    nextPrecisionAt = performance.now() + nextPrecisionDelay(Math.random, true) * 1000;
    interiorMachine = null;
    interiorSessionActive = false;
    interiorCooldownUntil = 0;
    interiorSessionHarvests = 0;
    interiorSessionAmount = 0;
    wireCooldownUntil = 0;
    factoryCooldownUntil = 0;
    traceCooldownUntil = 0;
    nanoCooldownUntil = 0;
    swarmCooldownUntil = 0;
    ui.hideBonusEvent();
    ui.hidePrecisionTarget();
    ui.closeInteriorView();
    applyTheme(state.settings.theme);
    ui.announce(`再起動完了：最適化コアを${gain}個獲得`, 'success');
    ui.addLog('CORE', `プロトコル再起動：恒久倍率 ×${(1 + state.optimizationCores * 0.25).toFixed(2)}`);
    ui.render(state, true);
    saveGame(state);
  },
  saveNow: () => {
    const saved = saveGame(state);
    ui.setSaveStatus(saved ? '保存しました' : '保存に失敗しました');
    ui.announce(saved ? '現在の状態を保存しました' : '保存できませんでした', saved ? 'success' : 'warning');
  },
});

function updateAndAnnounceUnlocks(): void {
  for (const id of updateUnlocks(state)) {
    const message = `新設備「${getMachine(id).name}」が解放されました`;
    ui.announce(message, 'success');
    ui.addLog('OPEN', message);
  }
}

function updateProgressionEvents(): void {
  updateAndAnnounceUnlocks();
  const phaseRewards = grantDuePhaseRewards(state);
  updateAndAnnounceUnlocks();
  const phase = currentPhase(state);
  if (phase.id !== observedPhaseId) {
    observedPhaseId = phase.id;
    const message = `生産フェーズが「${phase.name}」へ移行しました`;
    ui.announce(message, 'success');
    ui.addLog('PHASE', message);
    document.documentElement.classList.remove('phase-transition');
    requestAnimationFrame(() => document.documentElement.classList.add('phase-transition'));
  }
  if (phaseRewards.length > 0) {
    const latest = phaseRewards.at(-1)!;
    const amount = Math.floor(latest.amount).toLocaleString('ja-JP');
    const viewMessage = `観測確定「${latest.phase.name}」：${latest.phase.note} +${amount}クリップ`;
    ui.announce(viewMessage, 'success');
    ui.addLog('VIEW', viewMessage);
  }
  const currentIds = new Set(unlockedAchievementIds(state));
  const newlyUnlocked = ACHIEVEMENTS.filter((achievement) => currentIds.has(achievement.id) && !observedAchievementIds.has(achievement.id));
  for (const achievement of newlyUnlocked) {
    const message = `実績「${achievement.name}」解除 · 全設備+2%`;
    ui.addLog('ACHV', message);
  }
  if (newlyUnlocked.length > 0) ui.render(state, true);
  for (const achievement of newlyUnlocked.slice(0, 3)) {
    ui.announce(`実績解除：${achievement.name} · 全設備+2%`, 'success');
    ui.flashAchievement(achievement.id);
  }
  if (newlyUnlocked.length > 3) ui.announce(`ほか${newlyUnlocked.length - 3}件の実績を解除しました`, 'success');
  observedAchievementIds = currentIds;
}

applyTheme(state.settings.theme);
updateAndAnnounceUnlocks();
ui.addLog('BOOT', '生産プロトコルを開始');
ui.render(state, true);

if (loaded.recovered) ui.announce('セーブデータを読み込めなかったため、新しいゲームを開始しました', 'warning');
if (loaded.offlineSeconds >= 2 && loaded.offlineClips > 0) {
  const minutes = Math.max(1, Math.floor(loaded.offlineSeconds / 60));
  ui.announce(`${minutes}分の不在中に ${Math.floor(loaded.offlineClips).toLocaleString('ja-JP')} クリップを生産しました`, 'success');
}

const loop = new GameLoop((elapsedSeconds) => {
  produceForDuration(state, elapsedSeconds);
  state.playTimeSeconds += elapsedSeconds;
  autoBuyAccumulator += elapsedSeconds;
  while (autoBuyAccumulator >= 1) {
    autoBuyAccumulator -= 1;
    const before = { ...state.machines };
    for (const id of autoBuyTick(state)) {
      advanceDirective(state, 'procurementOrder');
      const reached = crossedMilestones(before[id], state.machines[id]);
      const latestMilestone = reached.at(-1);
      if (latestMilestone) {
        const milestoneMessage = `${getMachine(id).name}：${latestMilestone.name}、生産×${latestMilestone.multiplier}`;
        ui.announce(milestoneMessage, 'success');
        ui.addLog('MILE', milestoneMessage);
        ui.flashMachine(id);
      }
    }
  }
  updateProgressionEvents();
  const currentSignalBuffs = new Set(activeSignalBuffs(state));
  for (const id of observedSignalBuffs) {
    if (!currentSignalBuffs.has(id)) ui.addLog('BUFF', `${SIGNAL_BUFFS.find((buff) => buff.id === id)!.name}が終了`);
  }
  observedSignalBuffs = currentSignalBuffs;
  const now = performance.now();
  if (bonusVisible) {
    const remainingSeconds = (bonusExpiresAt - now) / 1000;
    if (remainingSeconds <= 0) {
      scheduleNextBonus(now);
      ui.hideBonusEvent();
    } else {
      ui.showBonusEvent(remainingSeconds, BONUS_DURATION_SECONDS);
    }
  } else if (now >= nextBonusAt) {
    bonusVisible = true;
    bonusExpiresAt = now + BONUS_DURATION_SECONDS * 1000;
    ui.showBonusEvent(BONUS_DURATION_SECONDS, BONUS_DURATION_SECONDS);
    ui.addLog('SIGNAL', '異常クリップを検出しました');
  }
  if (precisionVisible) {
    const remainingSeconds = (precisionExpiresAt - now) / 1000;
    if (remainingSeconds <= 0) {
      if (precisionRemaining === 0) {
        const amount = applyPrecisionReward(state, precisionRequired);
        advanceDirective(state, 'signalCapture');
        const message = `精密信号成功：${precisionRequired}回一致、+${Math.floor(amount).toLocaleString('ja-JP')}クリップ`;
        ui.announce(message, 'success');
        ui.addLog('PRECISION', message);
        updateProgressionEvents();
        ui.render(state, true);
      } else {
        const clicked = precisionRequired - precisionRemaining;
        ui.addLog('MISS', `精密信号失敗：${clicked} / ${precisionRequired}回`);
      }
      scheduleNextPrecision(now);
      ui.hidePrecisionTarget();
    } else {
      ui.showPrecisionTarget(precisionRemaining, remainingSeconds, precisionCurrentDuration, precisionPositionIndex);
    }
  } else if (now >= nextPrecisionAt) {
    precisionVisible = true;
    precisionRequired = precisionClickTarget();
    precisionRemaining = precisionRequired;
    precisionPositionIndex = precisionPosition();
    precisionCurrentDuration = precisionDuration(state, PRECISION_DURATION_SECONDS);
    precisionExpiresAt = now + precisionCurrentDuration * 1000;
    ui.showPrecisionTarget(precisionRemaining, precisionCurrentDuration, precisionCurrentDuration, precisionPositionIndex);
    ui.addLog('SIGNAL', `精密クリック信号：${precisionRequired}回`);
  }
  if (interiorMachine === PLAYABLE_INTERIOR) {
    if (interiorSessionActive) {
      const remainingSeconds = (interiorSessionEndsAt - now) / 1000;
      if (remainingSeconds <= 0) {
        interiorSessionActive = false;
        interiorCooldownUntil = now + INTERIOR_COOLDOWN_MS;
        ui.setInteriorStatus('ライン待機');
      } else {
        ui.setInteriorStatus(`回収中 · 残り${Math.ceil(remainingSeconds)}秒`);
        if (now >= interiorSpawnAt && ui.interiorClipCount() < INTERIOR_MAX_LIVE) {
          const point = randomInteriorPosition();
          ui.spawnInteriorClip(point.x, point.y);
          interiorSpawnAt = now + INTERIOR_SPAWN_MS;
        }
      }
    } else if (now < interiorCooldownUntil) {
      ui.setInteriorStatus(`ライン待機 · 残り${Math.ceil((interiorCooldownUntil - now) / 1000)}秒`);
    } else {
      interiorSessionActive = true;
      interiorSessionEndsAt = now + INTERIOR_SESSION_MS;
      interiorSpawnAt = now;
      ui.setInteriorStatus(`回収中 · 残り${Math.ceil(INTERIOR_SESSION_MS / 1000)}秒`);
    }
  }
  if (interiorMachine === WIRE_INTERIOR) {
    if (now < wireCooldownUntil) {
      ui.setWireCalibration(wireRound, wireSuccesses, wireTargetStart, 0, `再校正待機 · 残り${Math.ceil((wireCooldownUntil - now) / 1000)}秒`, true);
    } else if (wireAttempts < WIRE_ROUNDS) {
      if (wireNextRoundAt > 0 && now >= wireNextRoundAt) {
        wireRound += 1;
        wireTargetStart = randomWireTarget();
        wireRoundStartedAt = now;
        wireNextRoundAt = 0;
      }
      if (wireNextRoundAt === 0) ui.setWireCalibration(wireRound, wireSuccesses, wireTargetStart, wireTensionPosition(now - wireRoundStartedAt, wirePeriodMs));
    }
  }
  if (interiorMachine === FACTORY_INTERIOR) {
    if (now < factoryCooldownUntil) {
      ui.setFactoryInspection(Math.min(factoryIndex, FACTORY_INSPECTIONS - 1), factoryCorrect, factoryBatch[Math.min(factoryIndex, FACTORY_INSPECTIONS - 1)] ?? 'standard', factoryResults, `再検査待機 · 残り${Math.ceil((factoryCooldownUntil - now) / 1000)}秒`, true);
    } else if (factoryIndex < FACTORY_INSPECTIONS && factoryNextInspectionAt > 0 && now >= factoryNextInspectionAt) {
      factoryNextInspectionAt = 0;
      ui.setFactoryInspection(factoryIndex, factoryCorrect, factoryBatch[factoryIndex]!, factoryResults);
    }
  }
  if (interiorMachine === TRACE_INTERIOR) {
    if (now < traceCooldownUntil) {
      renderTraceConsole(`再トレース待機 · 残り${Math.ceil((traceCooldownUntil - now) / 1000)}秒`, true);
    } else if (tracePhase === 'cooldown') {
      traceRound = 1;
      traceSuccesses = 0;
      traceAttempts = 0;
      traceResults = [];
      beginTraceRound(now);
    } else if (tracePhase === 'observe' && now >= traceObserveStepAt) {
      if (prefersReducedMotion() || traceRevealCount >= traceSequence.length) {
        tracePhase = 'echo';
        traceActiveNode = null;
        traceRevealCount = 0;
        renderTraceConsole(`ECHO · 再現 0 / ${traceSequence.length}`, false);
      } else {
        traceRevealCount += 1;
        traceActiveNode = traceSequence[traceRevealCount - 1] ?? null;
        traceObserveStepAt = now + TRACE_STEP_MS;
        renderTraceConsole('OBSERVE · 工程順を記録', true);
      }
    } else if (tracePhase === 'result' && traceNextRoundAt > 0 && now >= traceNextRoundAt) {
      traceRound += 1;
      beginTraceRound(now);
    }
  }
  if (interiorMachine === NANO_INTERIOR) {
    if (now < nanoCooldownUntil) {
      renderNanoConsole(`再掃引待機 · 残り${Math.ceil((nanoCooldownUntil - now) / 1000)}秒`, true);
    } else if (nanoPhase === 'cooldown') {
      nanoRound = 1;
      nanoSuccesses = 0;
      nanoAttempts = 0;
      nanoResults = [];
      beginNanoRound();
    } else if (nanoPhase === 'result' && nanoNextRoundAt > 0 && now >= nanoNextRoundAt) {
      nanoRound += 1;
      beginNanoRound();
    }
  }
  if (interiorMachine === SWARM_INTERIOR) {
    if (now < swarmCooldownUntil) {
      renderSwarmConsole(`再同期待機 · 残り${Math.ceil((swarmCooldownUntil - now) / 1000)}秒`, true);
    } else if (swarmPhase === 'cooldown') {
      swarmRound = 1;
      swarmSuccesses = 0;
      swarmAttempts = 0;
      swarmResults = [];
      beginSwarmRound();
    } else if (swarmPhase === 'result' && swarmNextRoundAt > 0 && now >= swarmNextRoundAt) {
      swarmRound += 1;
      beginSwarmRound();
    }
  }
  ui.render(state);
});
loop.start();

window.setInterval(() => {
  const saved = saveGame(state);
  ui.setSaveStatus(saved ? '自動保存 完了' : '保存に失敗');
}, 10_000);

window.addEventListener('beforeunload', () => saveGame(state));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(state);
});
