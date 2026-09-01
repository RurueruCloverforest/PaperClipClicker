import type { DirectiveId, GameState, MachineId, PurchaseMode, SignalBuffId, SurveyId, Theme, UpgradeId } from '../state';
import { MACHINES, UPGRADES, getMachine } from '../game/definitions';
import { clickProduction, isAutoBuyUnlocked, isUpgradeUnlocked, machineTotalProduction, machineUnitProduction, productionPerSecond, selectedPurchase } from '../game/clips';
import { ARTWORK, MACHINE_ARTWORK, PHASE_ARTWORK } from '../artwork';
import { currentPhase, nextProductionGoal } from '../game/progression';
import { TOTAL_MILESTONES, milestoneStatus, totalAchievedMilestones } from '../game/milestones';
import { ACHIEVEMENTS, achievementProductionMultiplier, unlockedAchievementIds } from '../game/achievements';
import { NEWS_HEADLINES } from '../game/news';
import { SIGNAL_BUFFS, activeSignalBuffs, isSignalBuffActive, signalBuffCost } from '../game/signalLab';
import { DIRECTIVES, canClaimDirective, directiveReward, directiveTarget } from '../game/directives';
import { REBOOT_PREVIEW_THRESHOLD, REBOOT_THRESHOLD, canReboot, rebootCoreGain, rebootMultiplier } from '../game/reboot';
import { SURVEYS, isSurveyUnlocked, surveyCost, surveyReward, surveyStatus } from '../game/survey';

export interface UiActions {
  makeClip: (event: MouseEvent) => void;
  collectBonusEvent: () => void;
  hitPrecisionTarget: () => void;
  buyMachine: (id: MachineId) => void;
  buyUpgrade: (id: UpgradeId) => void;
  changePurchaseMode: (mode: PurchaseMode) => void;
  changeTheme: (theme: Theme) => void;
  changeCompactNumbers: (enabled: boolean) => void;
  resetGame: () => void;
  saveNow: () => void;
  toggleAutoBuy: (id: MachineId, enabled: boolean) => void;
  setAllAutoBuy: (enabled: boolean) => void;
  openInterior: (id: MachineId) => void;
  closeInterior: () => void;
  collectInteriorClip: (event: MouseEvent) => void;
  lockWireTension: () => void;
  inspectFactoryItem: (choice: 'standard' | 'deformed') => void;
  echoAiTrace: (node: 0 | 1 | 2 | 3) => void;
  purgeNanoCell: (index: number) => void;
  toggleSwarmUnit: (index: number) => void;
  lockSwarmFormation: () => void;
  toggleOrbitalDock: (index: number) => void;
  lockOrbitalBerth: () => void;
  compileMatterCell: (index: number) => void;
  stripPlanetQuad: (index: 0 | 1 | 2 | 3) => void;
  toggleStellarPetal: (index: number) => void;
  lockStellarArray: () => void;
  claimFleetCell: (index: number) => void;
  incrementCausalGauge: (index: number) => void;
  lockCausalCollapse: () => void;
  launchSurvey: (id: SurveyId) => void;
  collectSurvey: (id: SurveyId) => void;
  activateSignalBuff: (id: SignalBuffId) => void;
  claimDirective: (id: DirectiveId) => void;
  rebootProtocol: () => void;
}

interface MachineCardRefs {
  card: HTMLElement;
  count: HTMLElement;
  production: HTMLElement;
  price: HTMLElement;
  button: HTMLButtonElement;
  milestoneName: HTMLElement;
  milestoneCount: HTMLElement;
  milestoneMultiplier: HTMLElement;
  milestoneProgress: HTMLElement;
  autoRow: HTMLElement;
  autoInput: HTMLInputElement;
  peek: HTMLButtonElement;
}

interface UpgradeCardRefs {
  price: HTMLElement;
  button: HTMLButtonElement;
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

const TRACE_NODE_META = [
  { code: 'IN', name: '取込' },
  { code: 'SORT', name: '選別' },
  { code: 'BEND', name: '折曲' },
  { code: 'OUT', name: '搬出' },
] as const;

export class GameUi {
  private readonly clips: HTMLElement;
  private readonly perSecond: HTMLElement;
  private readonly perClick: HTMLElement;
  private readonly total: HTMLElement;
  private readonly playTime: HTMLElement;
  private readonly makeButton: HTMLButtonElement;
  private readonly machineList: HTMLElement;
  private readonly upgradeList: HTMLElement;
  private readonly upgradeEmpty: HTMLElement;
  private readonly toastRegion: HTMLElement;
  private readonly settingsDialog: HTMLDialogElement;
  private readonly themeSelect: HTMLSelectElement;
  private readonly compactToggle: HTMLInputElement;
  private readonly saveStatus: HTMLElement;
  private readonly phaseName: HTMLElement;
  private readonly goalName: HTMLElement;
  private readonly goalTarget: HTMLElement;
  private readonly goalPercent: HTMLElement;
  private readonly goalProgress: HTMLElement;
  private readonly goalProgressbar: HTMLElement;
  private readonly purchaseButtons: HTMLButtonElement[];
  private readonly systemLog: HTMLOListElement;
  private readonly milestoneTotal: HTMLElement;
  private readonly achievementList: HTMLElement;
  private readonly achievementCount: HTMLElement;
  private readonly achievementCountStat: HTMLElement;
  private readonly achievementBonus: HTMLElement;
  private readonly bonusEvent: HTMLButtonElement;
  private readonly bonusCountdown: HTMLElement;
  private readonly bonusTimerFill: HTMLElement;
  private readonly bonusEventCount: HTMLElement;
  private readonly precisionTarget: HTMLButtonElement;
  private readonly precisionNumber: HTMLElement;
  private readonly precisionTime: HTMLElement;
  private readonly precisionTimer: HTMLElement;
  private readonly precisionCount: HTMLElement;
  private readonly autoBulkContainer: HTMLElement;
  private readonly autoBulkOn: HTMLButtonElement;
  private readonly autoBulkOff: HTMLButtonElement;
  private readonly observationPhase: HTMLElement;
  private readonly observationImage: HTMLImageElement;
  private readonly observationNote: HTMLElement;
  private readonly observationTicker: HTMLElement;
  private readonly observationTickerTrack: HTMLElement;
  private readonly interiorDialog: HTMLDialogElement;
  private readonly interiorTitle: HTMLElement;
  private readonly interiorStage: HTMLElement;
  private readonly interiorScene: HTMLImageElement;
  private readonly interiorUnsynced: HTMLElement;
  private readonly wireConsole: HTMLElement;
  private readonly factoryConsole: HTMLElement;
  private readonly traceConsole: HTMLElement;
  private readonly nanoConsole: HTMLElement;
  private readonly swarmConsole: HTMLElement;
  private readonly orbitalConsole: HTMLElement;
  private readonly matterConsole: HTMLElement;
  private readonly planetConsole: HTMLElement;
  private readonly stellarConsole: HTMLElement;
  private readonly fleetConsole: HTMLElement;
  private readonly causalConsole: HTMLElement;
  private readonly interiorStatus: HTMLElement;
  private readonly interiorHarvestCount: HTMLElement;
  private readonly wireCalibrationCount: HTMLElement;
  private readonly factoryQualityCount: HTMLElement;
  private readonly traceAiCount: HTMLElement;
  private readonly nanoPurgeCount: HTMLElement;
  private readonly swarmSyncCount: HTMLElement;
  private readonly orbitalBerthCount: HTMLElement;
  private readonly matterCompileCount: HTMLElement;
  private readonly planetStripCount: HTMLElement;
  private readonly stellarSyncCount: HTMLElement;
  private readonly fleetSpreadCount: HTMLElement;
  private readonly causalCollapseCount: HTMLElement;
  private readonly surveyRecoveredCount: HTMLElement;
  private readonly surveyPanelCount: HTMLElement;
  private readonly clickCombo: HTMLElement;
  private readonly maxClickComboCount: HTMLElement;
  private readonly reducedMotionQuery: MediaQueryList | null;
  private tickerPhaseId = '';
  private tickerIntervalId = 0;
  private lastAchievementSignature = '';
  private readonly machineCards = new Map<MachineId, MachineCardRefs>();
  private readonly upgradeCards = new Map<UpgradeId, UpgradeCardRefs>();
  private lastMachineSignature = '';
  private lastUpgradeSignature = '';
  private lastRenderAt = 0;

  constructor(private readonly root: HTMLElement, private readonly actions: UiActions) {
    this.root.innerHTML = this.template();
    this.root.insertAdjacentHTML('beforeend', this.precisionTargetTemplate());
    this.root.insertAdjacentHTML('beforeend', this.interiorTemplate());
    required<HTMLElement>(root, '.hero').insertAdjacentHTML('beforeend', this.bonusEventTemplate());
    required<HTMLElement>(root, '#play-time').closest('div')?.insertAdjacentHTML('beforebegin', '<div><dt>実績</dt><dd id="achievement-count-stat">0 / 14</dd></div><div><dt>マイルストーン</dt><dd id="milestone-count">0 / 48</dd></div><div><dt>異常回収</dt><dd id="bonus-event-count">0</dd></div><div><dt>精密成功</dt><dd id="precision-count">0</dd></div><div><dt>内部回収</dt><dd id="interior-harvest-count">0</dd></div><div><dt>張力校正</dt><dd id="wire-calibration-count">0</dd></div><div><dt>品質判定</dt><dd id="factory-quality-count">0</dd></div><div><dt>改善トレース</dt><dd id="trace-ai-count">0</dd></div><div><dt>不純物除去</dt><dd id="nano-purge-count">0</dd></div><div><dt>群同期</dt><dd id="swarm-sync-count">0</dd></div><div><dt>環状係留</dt><dd id="orbital-berth-count">0</dd></div><div><dt>対コンパイル</dt><dd id="matter-compile-count">0</dd></div><div><dt>採掘オーダー</dt><dd id="planet-strip-count">0</dd></div><div><dt>集光同調</dt><dd id="stellar-sync-count">0</dd></div><div><dt>複製展開</dt><dd id="fleet-spread-count">0</dd></div><div><dt>因果収束</dt><dd id="causal-collapse-count">0</dd></div><div><dt>探査帰還</dt><dd id="survey-recovered-count">0</dd></div><div><dt>最高連鎖</dt><dd id="max-click-combo">0</dd></div>');
    required<HTMLElement>(root, '.dashboard').insertAdjacentHTML('afterend', this.achievementPanelTemplate());
    required<HTMLElement>(root, '.achievement-panel').insertAdjacentHTML('afterend', this.signalLabTemplate());
    required<HTMLElement>(root, '#signal-lab').insertAdjacentHTML('afterend', this.directivePanelTemplate());
    required<HTMLElement>(root, '#directive-panel').insertAdjacentHTML('afterend', this.rebootPanelTemplate());
    required<HTMLElement>(root, '#reboot-panel').insertAdjacentHTML('afterend', this.surveyPanelTemplate());
    this.clips = required(root, '#clips-value');
    this.perSecond = required(root, '#per-second');
    this.perClick = required(root, '#per-click');
    this.total = required(root, '#total-clips');
    this.playTime = required(root, '#play-time');
    this.makeButton = required(root, '#make-clip');
    this.machineList = required(root, '#machine-list');
    this.upgradeList = required(root, '#upgrade-list');
    this.upgradeEmpty = required(root, '#upgrade-empty');
    this.toastRegion = required(root, '#toast-region');
    this.settingsDialog = required(root, '#settings-dialog');
    this.themeSelect = required(root, '#theme-select');
    this.compactToggle = required(root, '#compact-toggle');
    this.saveStatus = required(root, '#save-status');
    this.phaseName = required(root, '#phase-name');
    this.goalName = required(root, '#goal-name');
    this.goalTarget = required(root, '#goal-target');
    this.goalPercent = required(root, '#goal-percent');
    this.goalProgress = required(root, '#goal-progress');
    this.goalProgressbar = required(root, '.progress-track');
    this.purchaseButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-purchase-mode]')];
    this.systemLog = required(root, '#system-log');
    this.milestoneTotal = required(root, '#milestone-count');
    this.achievementList = required(root, '#achievement-list');
    this.achievementCount = required(root, '#achievement-count');
    this.achievementCountStat = required(root, '#achievement-count-stat');
    this.achievementBonus = required(root, '#achievement-bonus');
    this.bonusEvent = required(root, '#bonus-event');
    this.bonusCountdown = required(root, '#bonus-countdown');
    this.bonusTimerFill = required(root, '#bonus-timer-fill');
    this.bonusEventCount = required(root, '#bonus-event-count');
    this.precisionTarget = required(root, '#precision-target');
    this.precisionNumber = required(root, '#precision-number');
    this.precisionTime = required(root, '#precision-time');
    this.precisionTimer = required(root, '#precision-timer');
    this.precisionCount = required(root, '#precision-count');
    this.autoBulkContainer = required(root, '#auto-bulk-actions');
    this.autoBulkOn = required(root, '#auto-bulk-on');
    this.autoBulkOff = required(root, '#auto-bulk-off');
    this.observationPhase = required(root, '#observation-phase');
    this.observationImage = required(root, '#observation-image');
    this.observationNote = required(root, '#observation-note');
    this.observationTicker = required(root, '#observation-ticker');
    this.observationTickerTrack = required(root, '#observation-ticker-track');
    this.interiorDialog = required(root, '#interior-dialog');
    this.interiorTitle = required(root, '#interior-title');
    this.interiorStage = required(root, '#interior-stage');
    this.interiorScene = required(root, '#interior-scene');
    this.interiorUnsynced = required(root, '#interior-unsynced');
    this.wireConsole = required(root, '#wire-console');
    this.factoryConsole = required(root, '#factory-console');
    this.traceConsole = required(root, '#trace-console');
    this.nanoConsole = required(root, '#nano-console');
    this.swarmConsole = required(root, '#swarm-console');
    this.orbitalConsole = required(root, '#orbital-console');
    this.matterConsole = required(root, '#matter-console');
    this.planetConsole = required(root, '#planet-console');
    this.stellarConsole = required(root, '#stellar-console');
    this.fleetConsole = required(root, '#fleet-console');
    this.causalConsole = required(root, '#causal-console');
    this.interiorStatus = required(root, '#interior-status');
    this.interiorHarvestCount = required(root, '#interior-harvest-count');
    this.wireCalibrationCount = required(root, '#wire-calibration-count');
    this.factoryQualityCount = required(root, '#factory-quality-count');
    this.traceAiCount = required(root, '#trace-ai-count');
    this.nanoPurgeCount = required(root, '#nano-purge-count');
    this.swarmSyncCount = required(root, '#swarm-sync-count');
    this.orbitalBerthCount = required(root, '#orbital-berth-count');
    this.matterCompileCount = required(root, '#matter-compile-count');
    this.planetStripCount = required(root, '#planet-strip-count');
    this.stellarSyncCount = required(root, '#stellar-sync-count');
    this.fleetSpreadCount = required(root, '#fleet-spread-count');
    this.causalCollapseCount = required(root, '#causal-collapse-count');
    this.surveyRecoveredCount = required(root, '#survey-recovered-count');
    this.surveyPanelCount = required(root, '#survey-panel-count');
    this.clickCombo = required(root, '#click-combo');
    this.maxClickComboCount = required(root, '#max-click-combo');
    this.reducedMotionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reducedMotionQuery?.addEventListener('change', () => this.refreshTicker(this.tickerPhaseId));
    this.bindEvents();
  }

  render(state: GameState, force = false): void {
    const now = performance.now();
    if (!force && now - this.lastRenderAt < 80) return;
    this.lastRenderAt = now;
    const format = (value: number) => this.formatNumber(value, state.settings.compactNumbers);
    this.clips.textContent = format(state.clips);
    this.perSecond.textContent = `${format(productionPerSecond(state))} / 秒`;
    this.perClick.textContent = format(clickProduction(state));
    this.makeButton.setAttribute('aria-label', `クリップを作る、1回につき${format(clickProduction(state))}クリップ`);
    required<HTMLElement>(this.makeButton, '[data-click-yield]').textContent = `+${format(clickProduction(state))} / CLICK`;
    this.total.textContent = format(state.totalClips);
    this.playTime.textContent = this.formatDuration(state.playTimeSeconds);
    this.bonusEventCount.textContent = String(state.bonusEventsCollected);
    this.precisionCount.textContent = String(state.precisionTargetsCompleted);
    this.interiorHarvestCount.textContent = String(state.interiorHarvests);
    this.wireCalibrationCount.textContent = String(state.wireCalibrationSuccesses);
    this.factoryQualityCount.textContent = String(state.factoryQualityCorrect);
    this.traceAiCount.textContent = String(state.traceAiSuccesses);
    this.nanoPurgeCount.textContent = String(state.nanoPurgeSuccesses);
    this.swarmSyncCount.textContent = String(state.swarmSyncSuccesses);
    this.orbitalBerthCount.textContent = String(state.orbitalBerthSuccesses);
    this.matterCompileCount.textContent = String(state.matterCompileSuccesses);
    this.planetStripCount.textContent = String(state.planetStripSuccesses);
    this.stellarSyncCount.textContent = String(state.stellarSyncSuccesses);
    this.fleetSpreadCount.textContent = String(state.fleetSpreadSuccesses);
    this.causalCollapseCount.textContent = String(state.causalCollapseSuccesses);
    this.surveyRecoveredCount.textContent = String(state.surveysRecovered);
    this.maxClickComboCount.textContent = String(state.maxClickCombo);
    this.themeSelect.value = state.settings.theme;
    this.compactToggle.checked = state.settings.compactNumbers;
    this.milestoneTotal.textContent = `${totalAchievedMilestones(state)} / ${TOTAL_MILESTONES}`;
    this.renderAchievements(state);
    this.renderSignalLab(state, format);
    this.renderDirectives(state, format);
    this.renderReboot(state, format);
    this.renderSurvey(state, format);
    const phase = currentPhase(state);
    this.phaseName.textContent = phase.name;
    document.documentElement.dataset.phase = phase.id;
    this.observationPhase.textContent = phase.name;
    this.observationNote.textContent = phase.note;
    const phaseArt = PHASE_ARTWORK[phase.id as keyof typeof PHASE_ARTWORK] ?? ARTWORK.phaseManual;
    if (this.observationImage.getAttribute('src') !== phaseArt.src) {
      this.observationImage.src = phaseArt.src;
      this.observationImage.alt = phaseArt.alt.standalone;
    }
    if (phase.id !== this.tickerPhaseId) {
      this.tickerPhaseId = phase.id;
      this.refreshTicker(phase.id);
    }
    const goal = nextProductionGoal(state);
    const goalPercent = Math.floor(goal.progress * 100);
    this.goalName.textContent = goal.name;
    this.goalTarget.textContent = `${format(goal.target)} clips`;
    this.goalPercent.textContent = `${goalPercent}%`;
    this.goalProgress.style.width = `${goalPercent}%`;
    this.goalProgressbar.setAttribute('aria-valuenow', String(goalPercent));
    for (const button of this.purchaseButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.purchaseMode === String(state.purchaseMode)));
    }
    this.autoBulkContainer.hidden = !isAutoBuyUnlocked(state);
    this.renderMachines(state, format);
    this.renderUpgrades(state, format);
  }

  announce(message: string, kind: 'info' | 'success' | 'warning' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${kind}`;
    toast.textContent = message;
    this.toastRegion.append(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    window.setTimeout(() => {
      toast.classList.remove('toast--visible');
      window.setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  showBonusEvent(remainingSeconds: number, durationSeconds: number): void {
    const seconds = Math.max(0, remainingSeconds);
    this.bonusEvent.hidden = false;
    this.bonusCountdown.textContent = String(Math.ceil(seconds));
    this.bonusTimerFill.style.width = `${Math.max(0, Math.min(100, seconds / durationSeconds * 100))}%`;
    this.bonusEvent.classList.toggle('bonus-event--urgent', seconds <= 3);
    this.bonusEvent.setAttribute('aria-label', `異常クリップを回収、残り${Math.ceil(seconds)}秒`);
  }

  hideBonusEvent(): void {
    this.bonusEvent.hidden = true;
    this.bonusEvent.classList.remove('bonus-event--urgent');
  }

  showPrecisionTarget(remainingClicks: number, remainingSeconds: number, durationSeconds: number, position: number): void {
    this.precisionTarget.hidden = false;
    this.precisionTarget.dataset.position = String(position);
    this.precisionTarget.classList.toggle('precision-target--armed', remainingClicks === 0);
    this.precisionNumber.textContent = String(remainingClicks);
    this.precisionTime.textContent = `${remainingSeconds.toFixed(1)}秒`;
    this.precisionTimer.style.setProperty('--precision-progress', `${Math.max(0, Math.min(1, remainingSeconds / durationSeconds)) * 360}deg`);
    this.precisionTarget.setAttribute('aria-label', remainingClicks === 0
      ? `精密クリック信号、必要回数完了、追加クリック禁止、残り${remainingSeconds.toFixed(1)}秒`
      : `精密クリック信号、残り${remainingClicks}回、残り${remainingSeconds.toFixed(1)}秒`);
  }

  hidePrecisionTarget(): void {
    this.precisionTarget.hidden = true;
    this.precisionTarget.classList.remove('precision-target--armed');
  }

  showFloatingGain(amount: number, x: number, y: number, critical = false): void {
    const gain = document.createElement('span');
    gain.className = critical ? 'floating-gain floating-gain--critical' : 'floating-gain';
    gain.textContent = critical ? `⚡ +${this.formatNumber(amount, true)}` : `+${this.formatNumber(amount, true)}`;
    gain.style.left = `${x}px`;
    gain.style.top = `${y}px`;
    document.body.append(gain);
    window.setTimeout(() => gain.remove(), 800);
  }

  pulseManualProduction(): void {
    this.makeButton.classList.remove('is-producing');
    void this.makeButton.offsetWidth;
    this.makeButton.classList.add('is-producing');
  }

  setClickCombo(combo: number, multiplier: number): void {
    const visible = combo >= 2;
    this.clickCombo.hidden = !visible;
    this.clickCombo.textContent = combo >= 12 ? `CHAIN ${combo} ×${multiplier.toFixed(2)} MAX` : `CHAIN ${combo} ×${multiplier.toFixed(2)}`;
    this.makeButton.dataset.comboTier = combo >= 12 ? 'max' : combo >= 7 ? 'high' : visible ? 'mid' : '';
  }

  setSaveStatus(message: string): void {
    this.saveStatus.textContent = message;
  }

  addLog(code: string, message: string): void {
    this.systemLog.querySelector('.system-log__empty')?.remove();
    const item = document.createElement('li');
    const time = document.createElement('time');
    const type = document.createElement('code');
    const text = document.createElement('span');
    time.textContent = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    type.textContent = code;
    text.textContent = message;
    item.append(time, type, text);
    this.systemLog.prepend(item);
    while (this.systemLog.children.length > 6) this.systemLog.lastElementChild?.remove();
  }

  flashMachine(id: MachineId): void {
    const card = this.machineCards.get(id)?.card;
    if (!card) return;
    card.classList.remove('shop-card--milestone');
    requestAnimationFrame(() => card.classList.add('shop-card--milestone'));
  }

  flashAchievement(id: string): void {
    const card = this.achievementList.querySelector<HTMLElement>(`[data-achievement-id="${id}"]`);
    if (!card) return;
    card.classList.remove('achievement-card--new');
    requestAnimationFrame(() => card.classList.add('achievement-card--new'));
  }

  private renderAchievements(state: GameState): void {
    const unlockedIds = new Set(unlockedAchievementIds(state));
    const signature = [...unlockedIds].join('|');
    this.achievementCount.textContent = `${unlockedIds.size} / ${ACHIEVEMENTS.length}`;
    this.achievementCountStat.textContent = `${unlockedIds.size} / ${ACHIEVEMENTS.length}`;
    this.achievementBonus.textContent = `全設備 ×${achievementProductionMultiplier(state).toFixed(2)}`;
    if (signature === this.lastAchievementSignature) return;
    this.achievementList.innerHTML = '';
    for (const achievement of ACHIEVEMENTS) {
      const unlocked = unlockedIds.has(achievement.id);
      const card = document.createElement('article');
      card.className = `achievement-card achievement-card--${unlocked ? 'unlocked' : 'locked'}`;
      card.dataset.achievementId = achievement.id;
      card.innerHTML = `<div class="achievement-card__mark" aria-hidden="true">${unlocked ? '✓' : '⌑'}</div><div><h3>${escapeHtml(achievement.name)}</h3><p>${escapeHtml(achievement.description)}</p><small>${unlocked ? '解除済み' : '未解除'}</small></div>`;
      this.achievementList.append(card);
    }
    this.lastAchievementSignature = signature;
  }

  private refreshTicker(phaseId: string): void {
    const pool = NEWS_HEADLINES[phaseId] ?? [];
    window.clearInterval(this.tickerIntervalId);
    const reduced = this.reducedMotionQuery?.matches ?? false;
    this.observationTicker.classList.toggle('observation__ticker--static', reduced);
    if (pool.length === 0) {
      this.observationTickerTrack.innerHTML = '';
      return;
    }
    const picked = this.pickHeadlines(pool, reduced ? 8 : 14);
    this.observationTickerTrack.innerHTML = '';
    const rounds = reduced ? 1 : 2;
    for (let round = 0; round < rounds; round += 1) {
      for (const headline of picked) {
        const item = document.createElement('span');
        item.className = 'observation__ticker-item';
        item.textContent = headline;
        this.observationTickerTrack.append(item);
      }
    }
    if (reduced) {
      const items = [...this.observationTickerTrack.querySelectorAll<HTMLElement>('.observation__ticker-item')];
      let activeIndex = 0;
      items[0]?.setAttribute('data-active', '');
      this.tickerIntervalId = window.setInterval(() => {
        items[activeIndex]?.removeAttribute('data-active');
        activeIndex = (activeIndex + 1) % items.length;
        items[activeIndex]?.setAttribute('data-active', '');
      }, 5000);
    } else {
      const duration = Math.max(20, picked.length * 5);
      this.observationTicker.style.setProperty('--ticker-duration', `${duration}s`);
    }
  }

  private pickHeadlines(pool: string[], count: number): string[] {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked: string[] = [];
    for (let index = 0; index < count; index += 1) {
      picked.push(shuffled[index % shuffled.length]!);
    }
    return picked;
  }

  closeSettings(): void {
    this.settingsDialog.close();
  }

  openInteriorView(id: MachineId): void {
    const machine = getMachine(id);
    this.interiorTitle.textContent = machine.name;
    this.clearInteriorClips();
    this.wireConsole.hidden = true;
    this.factoryConsole.hidden = true;
    this.traceConsole.hidden = true;
    this.nanoConsole.hidden = true;
    this.swarmConsole.hidden = true;
    this.orbitalConsole.hidden = true;
    this.matterConsole.hidden = true;
    this.planetConsole.hidden = true;
    this.stellarConsole.hidden = true;
    this.fleetConsole.hidden = true;
    this.causalConsole.hidden = true;
    if (id === 'autoClipper') {
      const scene = ARTWORK.interiorAutoClipper;
      this.interiorScene.hidden = false;
      this.interiorScene.src = scene.src;
      this.interiorScene.alt = scene.alt.standalone;
      this.interiorUnsynced.hidden = true;
      this.interiorStatus.textContent = '折り曲げラインを観測中';
    } else if (id === 'wireMachine') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.wireConsole.hidden = false;
      this.interiorStatus.textContent = '張力校正を開始';
    } else if (id === 'clipFactory') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.factoryConsole.hidden = false;
      this.interiorStatus.textContent = '品質検査を開始';
    } else if (id === 'aiLine') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.traceConsole.hidden = false;
      this.interiorStatus.textContent = '改善トレースを開始';
    } else if (id === 'nanoForge') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.nanoConsole.hidden = false;
      this.interiorStatus.textContent = '不純物除去を開始';
    } else if (id === 'swarmAssembler') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.swarmConsole.hidden = false;
      this.interiorStatus.textContent = '群同期を開始';
    } else if (id === 'orbitalFoundry') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.orbitalConsole.hidden = false;
      this.interiorStatus.textContent = '環状係留を開始';
    } else if (id === 'matterCompiler') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.matterConsole.hidden = false;
      this.interiorStatus.textContent = '対コンパイルを開始';
    } else if (id === 'planetaryAssembler') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.planetConsole.hidden = false;
      this.interiorStatus.textContent = '採掘オーダーを開始';
    } else if (id === 'stellarHarvester') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.stellarConsole.hidden = false;
      this.interiorStatus.textContent = '集光同調を開始';
    } else if (id === 'galacticFleet') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.fleetConsole.hidden = false;
      this.interiorStatus.textContent = '複製展開を開始';
    } else if (id === 'causalOptimizer') {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = true;
      this.causalConsole.hidden = false;
      this.interiorStatus.textContent = '因果収束を開始';
    } else {
      this.interiorScene.hidden = true;
      this.interiorScene.removeAttribute('src');
      this.interiorScene.alt = '';
      this.interiorUnsynced.hidden = false;
      this.interiorUnsynced.textContent = 'この工程の内部プロトコルは未同期';
      this.interiorStatus.textContent = '内部プロトコル未同期';
    }
    if (!this.interiorDialog.open) this.interiorDialog.showModal();
  }

  closeInteriorView(): void {
    this.clearInteriorClips();
    if (this.interiorDialog.open) this.interiorDialog.close();
  }

  setInteriorStatus(text: string): void {
    this.interiorStatus.textContent = text;
  }

  setWireCalibration(round: number, successes: number, targetStart: number, position: number, result = '', disabled = false): void {
    required<HTMLElement>(this.wireConsole, '#wire-round').textContent = `CALIBRATION ${Math.min(round, 5)} / 5`;
    required<HTMLElement>(this.wireConsole, '#wire-successes').textContent = `LOCKED ${successes}`;
    const target = required<HTMLElement>(this.wireConsole, '#wire-target');
    target.style.left = `${targetStart}%`;
    required<HTMLElement>(this.wireConsole, '#wire-needle').style.left = `${position}%`;
    required<HTMLElement>(this.wireConsole, '#wire-result').textContent = result || '針を適正帯で固定してください';
    required<HTMLButtonElement>(this.wireConsole, '#wire-lock').disabled = disabled;
  }

  setFactoryInspection(index: number, correct: number, type: 'standard' | 'deformed', results: boolean[], message = '', disabled = false): void {
    required<HTMLElement>(this.factoryConsole, '#factory-count').textContent = `INSPECTION ${Math.min(index + 1, 8)} / 8`;
    required<HTMLElement>(this.factoryConsole, '#factory-score').textContent = `ACCURATE ${correct}`;
    const product = required<HTMLElement>(this.factoryConsole, '#factory-product');
    product.dataset.quality = type;
    required<HTMLElement>(product, '#factory-quality').textContent = type === 'standard' ? 'STANDARD' : 'DEFORMED';
    required<HTMLElement>(product, '#factory-defect').textContent = type === 'standard' ? '✓ SPEC OK' : '! DEFECT';
    required<HTMLElement>(this.factoryConsole, '#factory-result').textContent = message || '検査票を読み、搬送先を選択してください';
    [...this.factoryConsole.querySelectorAll<HTMLElement>('[data-factory-step]')].forEach((step, stepIndex) => {
      const result = results[stepIndex];
      step.textContent = result === undefined ? '○' : result ? '✓' : '×';
      step.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.factoryConsole.querySelectorAll<HTMLButtonElement>('[data-factory-choice]')) button.disabled = disabled;
  }

  setAiTrace(round: number, successes: number, sequence: Array<0 | 1 | 2 | 3>, echoIndex: number, results: boolean[], phase: 'observe' | 'echo' | 'result' | 'cooldown', activeNode: number | null, message: string, disabled = false, revealCount = 0): void {
    const phaseLabel = phase === 'observe' ? 'OBSERVE' : phase === 'echo' ? 'ECHO' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'SYNC' : 'DESYNC';
    this.traceConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'sync' : 'desync') : phase;
    required<HTMLElement>(this.traceConsole, '#trace-round').textContent = `TRACE ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.traceConsole, '#trace-phase').textContent = phaseLabel;
    required<HTMLElement>(this.traceConsole, '#trace-successes').textContent = `SYNC ${successes}`;
    required<HTMLElement>(this.traceConsole, '#trace-result').textContent = message || (phase === 'echo' ? `再現 ${echoIndex} / ${sequence.length}` : '工程順を観測してください');
    const pattern = required<HTMLElement>(this.traceConsole, '#trace-pattern');
    const visible = phase === 'echo' ? [] : sequence.slice(0, Math.max(0, revealCount));
    pattern.replaceChildren(...visible.map((node, index) => {
      const chip = document.createElement('span');
      chip.textContent = `${index + 1} ${TRACE_NODE_META[node]?.code ?? ''}`;
      return chip;
    }));
    [...this.traceConsole.querySelectorAll<HTMLElement>('[data-trace-step-lamp]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    const showAllNumbers = phase === 'observe' && activeNode === null && revealCount >= sequence.length && sequence.length > 0;
    const numbersByNode = new Map<number, string[]>();
    if (showAllNumbers) {
      sequence.forEach((node, index) => {
        const list = numbersByNode.get(node) ?? [];
        list.push(String(index + 1));
        numbersByNode.set(node, list);
      });
    }
    for (const button of this.traceConsole.querySelectorAll<HTMLButtonElement>('[data-trace-node]')) {
      const node = Number(button.dataset.traceNode);
      const isActive = activeNode === node;
      button.dataset.active = isActive ? 'true' : 'false';
      button.disabled = disabled;
      const step = required<HTMLElement>(button, '[data-trace-step]');
      if (showAllNumbers) step.textContent = (numbersByNode.get(node) ?? []).join(',');
      else if (isActive && phase === 'observe' && revealCount > 0) step.textContent = String(revealCount);
      else step.textContent = '';
    }
  }

  setNanoSweep(round: number, successes: number, waste: number[], purged: number[], fault: number | null, results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const remaining = Math.max(0, waste.length - purged.length);
    const phaseLabel = phase === 'play' ? 'SCAN' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'CLEAN' : 'CONTAM';
    this.nanoConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'clean' : 'contam') : phase;
    required<HTMLElement>(this.nanoConsole, '#nano-round').textContent = `SWEEP ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.nanoConsole, '#nano-phase').textContent = phaseLabel;
    required<HTMLElement>(this.nanoConsole, '#nano-successes').textContent = `CLEAN ${successes}`;
    required<HTMLElement>(this.nanoConsole, '#nano-remaining').textContent = `WASTE ${remaining} / ${waste.length || 5}`;
    required<HTMLElement>(this.nanoConsole, '#nano-result').textContent = message || '不純物だけを除去してください';
    [...this.nanoConsole.querySelectorAll<HTMLElement>('[data-nano-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.nanoConsole.querySelectorAll<HTMLButtonElement>('[data-nano-cell]')) {
      const index = Number(button.dataset.nanoCell);
      const isWaste = waste.includes(index);
      const isPurged = purged.includes(index);
      const isFault = fault === index;
      const kind = isPurged ? 'purged' : isFault ? 'fault' : isWaste ? 'waste' : 'lattice';
      button.dataset.kind = kind;
      button.disabled = disabled || isPurged || isFault;
      const label = required<HTMLElement>(button, '[data-nano-label]');
      label.textContent = kind === 'purged' ? 'ERASED' : kind === 'fault' ? 'FAULT' : kind === 'waste' ? 'WASTE' : 'OK';
      button.setAttribute('aria-label', `格子 ${index + 1}、${kind === 'waste' ? '不純物' : kind === 'purged' ? '除去済み' : kind === 'fault' ? '誤除去' : '正常格子'}`);
    }
  }

  setSwarmSync(round: number, successes: number, target: number, selected: boolean[], results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const count = selected.filter(Boolean).length;
    const phaseLabel = phase === 'play' ? 'FORM' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'LOCKED' : 'MISALIGN';
    this.swarmConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'locked' : 'misalign') : phase;
    required<HTMLElement>(this.swarmConsole, '#swarm-round').textContent = `SWARM ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.swarmConsole, '#swarm-phase').textContent = phaseLabel;
    required<HTMLElement>(this.swarmConsole, '#swarm-successes').textContent = `LOCKED ${successes}`;
    required<HTMLElement>(this.swarmConsole, '#swarm-need').textContent = `NEED ${target} · SELECT ${count}`;
    required<HTMLElement>(this.swarmConsole, '#swarm-result').textContent = message || '必要台数を選んで同期してください';
    const slots = required<HTMLElement>(this.swarmConsole, '#swarm-slots');
    const slotCount = Math.max(target, count);
    slots.replaceChildren(...Array.from({ length: slotCount }, (_, index) => {
      const slot = document.createElement('span');
      if (index >= target) {
        slot.dataset.fill = 'over';
        slot.textContent = '!';
      } else if (index < count) {
        slot.dataset.fill = 'on';
        slot.textContent = '●';
      } else {
        slot.dataset.fill = 'off';
        slot.textContent = '○';
      }
      return slot;
    }));
    [...this.swarmConsole.querySelectorAll<HTMLElement>('[data-swarm-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.swarmConsole.querySelectorAll<HTMLButtonElement>('[data-swarm-unit]')) {
      const index = Number(button.dataset.swarmUnit);
      const isOn = selected[index] === true;
      button.dataset.active = isOn ? 'true' : 'false';
      button.disabled = disabled;
      required<HTMLElement>(button, '[data-swarm-state]').textContent = isOn ? 'ACTIVE' : 'IDLE';
      button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      button.setAttribute('aria-label', `組立ユニット ${index + 1}、${isOn ? '選択中' : '非選択'}`);
    }
    required<HTMLButtonElement>(this.swarmConsole, '#swarm-lock').disabled = disabled;
  }

  setOrbitalBerth(round: number, successes: number, target: number, selected: boolean[], blocked: number[], results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const count = selected.filter(Boolean).length;
    const blockedSet = new Set(blocked);
    const phaseLabel = phase === 'play' ? 'RANGE' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'DOCKED' : 'DRIFT';
    this.orbitalConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'docked' : 'drift') : phase;
    required<HTMLElement>(this.orbitalConsole, '#orbital-round').textContent = `ORBIT ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.orbitalConsole, '#orbital-phase').textContent = phaseLabel;
    required<HTMLElement>(this.orbitalConsole, '#orbital-successes').textContent = `DOCKED ${successes}`;
    required<HTMLElement>(this.orbitalConsole, '#orbital-need').textContent = `NEED ${target} · SELECT ${count}`;
    required<HTMLElement>(this.orbitalConsole, '#orbital-result').textContent = message || '連続するドックを選んで係留してください';
    const slots = required<HTMLElement>(this.orbitalConsole, '#orbital-slots');
    const slotCount = Math.max(target, count);
    slots.replaceChildren(...Array.from({ length: slotCount }, (_, index) => {
      const slot = document.createElement('span');
      if (index >= target) {
        slot.dataset.fill = 'over';
        slot.textContent = '!';
      } else if (index < count) {
        slot.dataset.fill = 'on';
        slot.textContent = '●';
      } else {
        slot.dataset.fill = 'off';
        slot.textContent = '○';
      }
      return slot;
    }));
    [...this.orbitalConsole.querySelectorAll<HTMLElement>('[data-orbital-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.orbitalConsole.querySelectorAll<HTMLButtonElement>('[data-orbital-dock]')) {
      const index = Number(button.dataset.orbitalDock);
      const isBlocked = blockedSet.has(index);
      const isOn = selected[index] === true;
      const kind = isBlocked ? 'block' : phase === 'result' && isOn ? (results.at(-1) ? 'docked' : 'berth') : isOn ? 'berth' : 'open';
      const stateLabel = isBlocked ? 'BLOCK' : kind === 'docked' ? 'DOCKED' : isOn ? 'BERTH' : 'OPEN';
      button.dataset.kind = kind;
      button.disabled = disabled || isBlocked;
      required<HTMLElement>(button, '[data-orbital-state]').textContent = stateLabel;
      button.setAttribute('aria-pressed', isOn && !isBlocked ? 'true' : 'false');
      button.setAttribute('aria-label', `係留ドック ${index + 1}、${isBlocked ? '閉鎖' : isOn ? '選択中' : '開放'}`);
    }
    required<HTMLButtonElement>(this.orbitalConsole, '#orbital-lock').disabled = disabled;
  }

  setMatterCompile(round: number, successes: number, board: string[], compiled: boolean[], armed: number | null, fault: number | null, results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const remaining = Math.max(0, 3 - Math.floor(compiled.filter(Boolean).length / 2));
    const phaseLabel = phase === 'play' ? 'PAIR' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'COMPILED' : 'REJECT';
    this.matterConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'compiled' : 'reject') : phase;
    required<HTMLElement>(this.matterConsole, '#matter-round').textContent = `MATTER ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.matterConsole, '#matter-phase').textContent = phaseLabel;
    required<HTMLElement>(this.matterConsole, '#matter-successes').textContent = `COMPILED ${successes}`;
    required<HTMLElement>(this.matterConsole, '#matter-remaining').textContent = `PAIR ${remaining} / 3`;
    required<HTMLElement>(this.matterConsole, '#matter-result').textContent = message || '同じ物質署名を2つ束ねてください';
    [...this.matterConsole.querySelectorAll<HTMLElement>('[data-matter-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    const kindLabel: Record<string, string> = { ore: 'ORE', dust: 'DUST', flux: 'FLUX' };
    const kindName: Record<string, string> = { ore: '鉱石', dust: '塵', flux: '流束' };
    for (const button of this.matterConsole.querySelectorAll<HTMLButtonElement>('[data-matter-cell]')) {
      const index = Number(button.dataset.matterCell);
      const kind = board[index] ?? 'ore';
      const isDone = compiled[index] === true;
      const isArmed = armed === index;
      const isFault = fault === index;
      const visualKind = isDone ? 'done' : isFault ? 'reject' : kind;
      const stateLabel = isDone ? 'DONE' : isFault ? 'REJECT' : isArmed ? 'ARM' : kindLabel[kind] ?? 'ORE';
      button.dataset.kind = visualKind;
      button.dataset.armed = isArmed ? 'true' : 'false';
      button.disabled = disabled || isDone;
      required<HTMLElement>(button, '[data-matter-code]').textContent = kindLabel[kind] ?? 'ORE';
      required<HTMLElement>(button, '[data-matter-state]').textContent = stateLabel;
      button.setAttribute('aria-pressed', isArmed ? 'true' : 'false');
      button.setAttribute('aria-label', `物質マス ${index + 1}、${kindName[kind] ?? '鉱石'}、${isDone ? '変換済み' : isFault ? '誤対' : isArmed ? '武装中' : '未選択'}`);
    }
  }

  setPlanetStrip(round: number, successes: number, order: number[], step: number, last: number | null, fault: number | null, results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const codes = ['N', 'E', 'S', 'W'];
    const names = ['北', '東', '南', '西'];
    const phaseLabel = phase === 'play' ? 'STRIP' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'CLEARED' : 'FAULT';
    this.planetConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'cleared' : 'fault') : phase;
    required<HTMLElement>(this.planetConsole, '#planet-round').textContent = `CRUST ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.planetConsole, '#planet-phase').textContent = phaseLabel;
    required<HTMLElement>(this.planetConsole, '#planet-successes').textContent = `CLEARED ${successes}`;
    required<HTMLElement>(this.planetConsole, '#planet-result').textContent = message || '表示された順路どおりに象限を剥がしてください';
    [...this.planetConsole.querySelectorAll<HTMLElement>('[data-planet-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    const chips = required<HTMLElement>(this.planetConsole, '#planet-order');
    chips.replaceChildren(...order.map((quad, index) => {
      const chip = document.createElement('span');
      if (index < step) {
        chip.dataset.chip = 'done';
        chip.textContent = '✓';
      } else if (index === step && phase === 'play') {
        chip.dataset.chip = 'next';
        chip.textContent = `NEXT ${codes[quad]}`;
      } else {
        chip.dataset.chip = 'wait';
        chip.textContent = codes[quad] ?? 'N';
      }
      return chip;
    }));
    for (const button of this.planetConsole.querySelectorAll<HTMLButtonElement>('[data-planet-quad]')) {
      const index = Number(button.dataset.planetQuad);
      const isNext = phase === 'play' && order[step] === index;
      const isLast = last === index;
      const isFault = fault === index;
      const kind = isFault ? 'fault' : isLast ? 'stripped' : 'idle';
      const stateLabel = isFault ? 'FAULT' : isNext ? 'NEXT' : isLast ? 'STRIPPED' : codes[index] ?? 'N';
      button.dataset.kind = kind;
      button.dataset.next = isNext ? 'true' : 'false';
      button.disabled = disabled;
      required<HTMLElement>(button, '[data-planet-state]').textContent = stateLabel;
      button.setAttribute('aria-label', `象限 ${names[index] ?? '北'}、${isNext ? '次の採掘' : isFault ? '誤採掘' : isLast ? '直前に剥離' : '待機'}`);
    }
  }

  setStellarSync(round: number, successes: number, target: boolean[], open: boolean[], results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const phaseLabel = phase === 'play' ? 'ALIGN' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'LOCKED' : 'FLARE';
    this.stellarConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'locked' : 'flare') : phase;
    required<HTMLElement>(this.stellarConsole, '#stellar-round').textContent = `STELLAR ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.stellarConsole, '#stellar-phase').textContent = phaseLabel;
    required<HTMLElement>(this.stellarConsole, '#stellar-successes').textContent = `LOCKED ${successes}`;
    required<HTMLElement>(this.stellarConsole, '#stellar-need').textContent = `NEED ${target.filter(Boolean).length} OPEN`;
    required<HTMLElement>(this.stellarConsole, '#stellar-result').textContent = message || '目標と同じ羽根を開いて同調してください';
    const slots = required<HTMLElement>(this.stellarConsole, '#stellar-slots');
    slots.replaceChildren(...target.map((on, index) => {
      const slot = document.createElement('span');
      slot.dataset.fill = on ? 'on' : 'off';
      slot.textContent = String(index + 1);
      return slot;
    }));
    [...this.stellarConsole.querySelectorAll<HTMLElement>('[data-stellar-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.stellarConsole.querySelectorAll<HTMLButtonElement>('[data-stellar-petal]')) {
      const index = Number(button.dataset.stellarPetal);
      const isOn = open[index] === true;
      const kind = phase === 'result' && isOn && results.at(-1) ? 'locked' : 'idle';
      button.dataset.open = isOn ? 'true' : 'false';
      button.dataset.kind = kind;
      button.disabled = disabled;
      required<HTMLElement>(button, '[data-stellar-state]').textContent = isOn ? 'OPEN' : 'FOLD';
      button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      button.setAttribute('aria-label', `集光羽根 ${index + 1}、${isOn ? '開放' : '折畳'}`);
    }
    required<HTMLButtonElement>(this.stellarConsole, '#stellar-lock').disabled = disabled;
  }

  setFleetSpread(round: number, successes: number, seed: number, owned: boolean[], fault: number | null, results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const linked = owned.filter(Boolean).length;
    const phaseLabel = phase === 'play' ? 'SPREAD' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'LINKED' : 'ISOLATE';
    this.fleetConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'linked' : 'isolate') : phase;
    required<HTMLElement>(this.fleetConsole, '#fleet-round').textContent = `FLEET ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.fleetConsole, '#fleet-phase').textContent = phaseLabel;
    required<HTMLElement>(this.fleetConsole, '#fleet-successes').textContent = `LINKED ${successes}`;
    required<HTMLElement>(this.fleetConsole, '#fleet-remaining').textContent = `LINK ${linked} / 9`;
    required<HTMLElement>(this.fleetConsole, '#fleet-result').textContent = message || '隣接する空き星域へ複製してください';
    [...this.fleetConsole.querySelectorAll<HTMLElement>('[data-fleet-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.fleetConsole.querySelectorAll<HTMLButtonElement>('[data-fleet-cell]')) {
      const index = Number(button.dataset.fleetCell);
      const row = Math.floor(index / 3);
      const col = index % 3;
      const isOwned = owned[index] === true;
      const isSeed = index === seed;
      const isFault = fault === index;
      const isReach = !isOwned && ((row > 0 && owned[index - 3]) || (row < 2 && owned[index + 3]) || (col > 0 && owned[index - 1]) || (col < 2 && owned[index + 1]));
      const kind = isFault ? 'fault' : isSeed && isOwned ? 'seed' : isOwned ? 'claim' : isReach ? 'reach' : 'empty';
      const stateLabel = isFault ? 'ISOLATE' : isSeed && isOwned ? 'SEED' : isOwned ? 'CLAIM' : isReach ? 'REACH' : 'EMPTY';
      button.dataset.kind = kind;
      button.disabled = disabled || isOwned;
      required<HTMLElement>(button, '[data-fleet-state]').textContent = stateLabel;
      button.setAttribute('aria-pressed', isOwned ? 'true' : 'false');
      button.setAttribute('aria-label', `星域 ${index + 1}、${isFault ? '孤立' : isSeed && isOwned ? '初期シード' : isOwned ? '占有済み' : isReach ? '隣接して複製可能' : '空き'}`);
    }
  }

  setCausalCollapse(round: number, successes: number, values: number[], results: boolean[], phase: 'play' | 'result' | 'cooldown', message: string, disabled = false): void {
    const labels = ['α', 'β', 'γ', 'δ'];
    const synced = values.length >= 4 && values.slice(0, 4).every((value) => value === values[0]);
    const span = values.length ? Math.max(...values.slice(0, 4)) - Math.min(...values.slice(0, 4)) : 0;
    const phaseLabel = phase === 'play' ? 'DRIFT' : phase === 'cooldown' ? 'STANDBY' : results.at(-1) ? 'SINGULAR' : 'SPLIT';
    this.causalConsole.dataset.phase = phase === 'result' ? (results.at(-1) ? 'singular' : 'split') : phase;
    required<HTMLElement>(this.causalConsole, '#causal-round').textContent = `CAUSAL ${Math.min(Math.max(round, 1), 4)} / 4`;
    required<HTMLElement>(this.causalConsole, '#causal-phase').textContent = phaseLabel;
    required<HTMLElement>(this.causalConsole, '#causal-successes').textContent = `SINGULAR ${successes}`;
    required<HTMLElement>(this.causalConsole, '#causal-span').textContent = `SPAN ${span}`;
    required<HTMLElement>(this.causalConsole, '#causal-result').textContent = message || '4本の指標を同じ値へ揃えて収束してください';
    [...this.causalConsole.querySelectorAll<HTMLElement>('[data-causal-step]')].forEach((lamp, lampIndex) => {
      const result = results[lampIndex];
      lamp.textContent = result === undefined ? '○' : result ? '✓' : '×';
      lamp.dataset.result = result === undefined ? 'pending' : result ? 'correct' : 'wrong';
    });
    for (const button of this.causalConsole.querySelectorAll<HTMLButtonElement>('[data-causal-gauge]')) {
      const index = Number(button.dataset.causalGauge);
      const value = values[index] ?? 0;
      button.dataset.sync = synced ? 'true' : 'false';
      button.disabled = disabled;
      required<HTMLElement>(button, '[data-causal-value]').textContent = String(value);
      required<HTMLElement>(button, '[data-causal-state]').textContent = synced ? 'SYNC' : 'DRIFT';
      [...button.querySelectorAll<HTMLElement>('[data-causal-pip]')].forEach((pip, pipIndex) => {
        const level = 3 - pipIndex;
        pip.dataset.on = value >= level ? 'true' : 'false';
      });
      button.setAttribute('aria-label', `指標 ${labels[index] ?? 'α'}、値 ${value}、${synced ? '一致' : 'ずれ'}`);
    }
    required<HTMLButtonElement>(this.causalConsole, '#causal-lock').disabled = disabled;
  }

  interiorClipCount(): number {
    return this.interiorStage.querySelectorAll('.interior-clip').length;
  }

  spawnInteriorClip(xPercent: number, yPercent: number): void {
    const paperclip = ARTWORK.paperclipMain;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'interior-clip';
    button.style.left = `${xPercent}%`;
    button.style.top = `${yPercent}%`;
    button.setAttribute('aria-label', '完成クリップを回収');
    button.innerHTML = `<img src="${escapeHtml(paperclip.src)}" alt="" width="48" height="48" />`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.actions.collectInteriorClip(event);
      button.remove();
    });
    this.interiorStage.append(button);
  }

  clearInteriorClips(): void {
    this.interiorStage.querySelectorAll('.interior-clip').forEach((node) => node.remove());
  }

  private renderMachines(state: GameState, format: (value: number) => string): void {
    const visible = MACHINES.filter((machine) => state.unlockedMachines.includes(machine.id));
    const signature = visible.map((machine) => machine.id).join('|');
    if (signature !== this.lastMachineSignature) {
      this.machineList.innerHTML = '';
      this.machineCards.clear();
      for (const machine of visible) {
        const card = document.createElement('article');
        card.className = 'shop-card';
        const tier = Math.ceil(((MACHINES.indexOf(machine) + 1) / MACHINES.length) * 4);
        const icon = MACHINE_ARTWORK[machine.id];
        card.innerHTML = `<button type="button" class="shop-card__peek shop-card__icon" data-tier="${tier}" data-peek="${machine.id}" disabled aria-label="${escapeHtml(machine.name)}の内部をのぞく"><img src="${escapeHtml(icon.src)}" alt="" width="${icon.width}" height="${icon.height}" /><span class="shop-card__glyph">${escapeHtml(machine.icon)}</span></button><div class="shop-card__body"><div class="shop-card__heading"><h3>${escapeHtml(machine.name)}</h3><span class="owned" data-count></span></div><p>${escapeHtml(machine.description)}</p><span class="production" data-production></span><div class="milestone"><div class="milestone__meta"><span data-milestone-name>次：安定稼働</span><span data-milestone-count>0 / 10</span><strong data-milestone-multiplier>×1</strong></div><div class="milestone__track" aria-hidden="true"><span data-milestone-progress></span></div></div><div class="auto-toggle" data-auto-toggle hidden><span class="auto-toggle__label">自動購入</span><input type="checkbox" role="switch" class="auto-toggle__input" data-auto-input aria-label="${escapeHtml(machine.name)}の自動購入" /></div></div><button class="buy-button" type="button" data-buy-machine="${machine.id}"><span>購入</span><strong data-price></strong></button>`;
        const iconImage = required<HTMLImageElement>(card, '.shop-card__icon img');
        const glyph = required<HTMLElement>(card, '.shop-card__glyph');
        iconImage.addEventListener('error', () => {
          iconImage.hidden = true;
          glyph.hidden = false;
        });
        this.machineList.append(card);
        const button = required<HTMLButtonElement>(card, '[data-buy-machine]');
        button.addEventListener('click', () => this.actions.buyMachine(machine.id));
        const autoInput = required<HTMLInputElement>(card, '[data-auto-input]');
        autoInput.addEventListener('change', () => this.actions.toggleAutoBuy(machine.id, autoInput.checked));
        const peek = required<HTMLButtonElement>(card, '[data-peek]');
        peek.addEventListener('click', () => this.actions.openInterior(machine.id));
        this.machineCards.set(machine.id, {
          card,
          count: required(card, '[data-count]'),
          production: required(card, '[data-production]'),
          price: required(card, '[data-price]'),
          button,
          milestoneName: required(card, '[data-milestone-name]'),
          milestoneCount: required(card, '[data-milestone-count]'),
          milestoneMultiplier: required(card, '[data-milestone-multiplier]'),
          milestoneProgress: required(card, '[data-milestone-progress]'),
          autoRow: required(card, '[data-auto-toggle]'),
          autoInput,
          peek,
        });
      }
      this.lastMachineSignature = signature;
    }
    const autoUnlocked = isAutoBuyUnlocked(state);
    for (const machine of visible) {
      const refs = this.machineCards.get(machine.id);
      if (!refs) continue;
      const purchase = selectedPurchase(state, machine.id, state.purchaseMode);
      const count = state.machines[machine.id];
      refs.autoRow.hidden = !autoUnlocked;
      refs.autoInput.checked = state.autoBuyEnabled[machine.id];
      refs.peek.disabled = count < 1;
      refs.peek.setAttribute('aria-label', count < 1 ? `${machine.name}は所有後に内部をのぞけます` : `${machine.name}の内部をのぞく`);
      refs.card.classList.toggle('shop-card--auto', autoUnlocked && state.autoBuyEnabled[machine.id]);
      refs.count.textContent = `${count} 台`;
      refs.production.textContent = `合計 ${format(machineTotalProduction(state, machine.id))} / 秒 · 1台 ${format(machineUnitProduction(state, machine.id))}`;
      const milestone = milestoneStatus(count);
      refs.milestoneName.textContent = milestone.next ? `次：${milestone.next.name}` : '完全最適化';
      refs.milestoneCount.textContent = milestone.next ? `${count} / ${milestone.next.count}` : `${count} / 100`;
      refs.milestoneMultiplier.textContent = `×${milestone.multiplier}`;
      refs.milestoneProgress.style.width = `${Math.floor(milestone.progress * 100)}%`;
      refs.card.classList.toggle('shop-card--complete', milestone.next === null);
      const quantityLabel = state.purchaseMode === 'max' ? `MAX ${purchase.count}台` : `×${purchase.count}`;
      refs.price.textContent = `${quantityLabel} · ${format(purchase.price)} clips`;
      refs.button.disabled = purchase.count < 1 || state.clips + Number.EPSILON < purchase.price;
      refs.button.setAttribute('aria-label', `${machine.name}を${purchase.count}台、${format(purchase.price)}クリップで購入`);
    }
  }

  private renderUpgrades(state: GameState, format: (value: number) => string): void {
    const visible = UPGRADES.filter((upgrade) => isUpgradeUnlocked(state, upgrade.id));
    const signature = visible.map((upgrade) => upgrade.id).join('|');
    if (signature !== this.lastUpgradeSignature) {
      this.upgradeList.innerHTML = '';
      this.upgradeCards.clear();
      for (const upgrade of visible) {
        const card = document.createElement('article');
        card.className = 'upgrade-card';
        card.innerHTML = `<div class="upgrade-mark" aria-hidden="true">↑</div><div><h3>${escapeHtml(upgrade.name)}</h3><p>${escapeHtml(upgrade.description)}</p></div><button class="buy-button buy-button--compact" type="button" data-buy-upgrade="${upgrade.id}"><span>導入</span><strong data-price></strong></button>`;
        this.upgradeList.append(card);
        const button = required<HTMLButtonElement>(card, '[data-buy-upgrade]');
        button.addEventListener('click', () => this.actions.buyUpgrade(upgrade.id));
        this.upgradeCards.set(upgrade.id, { price: required(card, '[data-price]'), button });
      }
      this.lastUpgradeSignature = signature;
    }
    this.upgradeEmpty.hidden = visible.length > 0;
    for (const upgrade of visible) {
      const refs = this.upgradeCards.get(upgrade.id);
      if (!refs) continue;
      refs.price.textContent = `${format(upgrade.price)} clips`;
      refs.button.disabled = state.clips + Number.EPSILON < upgrade.price;
      refs.button.setAttribute('aria-label', `${upgrade.name}を${format(upgrade.price)}クリップで導入`);
    }
  }

  private renderSignalLab(state: GameState, format: (value: number) => string): void {
    const panel = required<HTMLElement>(this.root, '#signal-lab');
    const active = activeSignalBuffs(state);
    panel.hidden = state.totalClips < 1_000 && active.length === 0;
    panel.classList.toggle('signal-lab--triad', active.length === 3);
    const now = Date.now();
    for (const buff of SIGNAL_BUFFS) {
      const card = required<HTMLElement>(panel, `[data-signal-card="${buff.id}"]`);
      const button = required<HTMLButtonElement>(card, 'button');
      const enabled = isSignalBuffActive(state, buff.id, now);
      const cost = signalBuffCost(buff.id, productionPerSecond(state));
      card.classList.toggle('signal-switch--active', enabled);
      required<HTMLElement>(card, '[data-signal-status]').textContent = enabled ? 'ACTIVE' : 'STANDBY';
      required<HTMLElement>(card, '[data-signal-time]').textContent = enabled ? this.formatCountdown((state.signalBuffExpiresAt[buff.id] - now) / 1000) : `${buff.durationSeconds / 60}分`;
      required<HTMLElement>(card, '[data-signal-price]').textContent = enabled ? '稼働中' : `${format(cost)} clips`;
      button.disabled = enabled || state.clips + Number.EPSILON < cost;
      button.setAttribute('aria-label', enabled ? `${buff.name}、残り${this.formatCountdown((state.signalBuffExpiresAt[buff.id] - now) / 1000)}` : `${buff.name}を${format(cost)}クリップで起動`);
    }
    const effects: string[] = [];
    if (active.includes('productionSurge') && active.includes('precisionAssist')) effects.push('過給予測：手動クリック ×3');
    if (active.includes('productionSurge') && active.includes('signalBeacon')) effects.push('過給ビーコン：異常報酬 合計×3');
    if (active.includes('precisionAssist') && active.includes('signalBeacon')) effects.push('予測ビーコン：精密報酬 合計×3');
    if (active.length === 3) effects.push('三相共鳴：全設備 追加×1.5');
    required<HTMLElement>(panel, '#signal-synergies').innerHTML = effects.length > 0
      ? effects.map((effect) => `<span>${escapeHtml(effect)}</span>`).join('')
      : '<small>2系統以上を同時起動すると共鳴効果が発生します。</small>';
  }

  private renderDirectives(state: GameState, format: (value: number) => string): void {
    const panel = required<HTMLElement>(this.root, '#directive-panel');
    panel.hidden = state.totalClips < 500 && Object.values(state.directiveProgress).every((value) => value === 0);
    let readyCount = 0;
    for (const directive of DIRECTIVES) {
      const card = required<HTMLElement>(panel, `[data-directive-card="${directive.id}"]`);
      const target = directiveTarget(state, directive.id);
      const progress = state.directiveProgress[directive.id];
      const ready = canClaimDirective(state, directive.id);
      if (ready) readyCount += 1;
      card.classList.toggle('directive-card--ready', ready);
      required<HTMLElement>(card, '[data-directive-rank]').textContent = `RANK ${state.directiveCompletions[directive.id]}`;
      required<HTMLElement>(card, '[data-directive-status]').textContent = ready ? 'READY' : 'RUNNING';
      required<HTMLElement>(card, '[data-directive-progress]').textContent = `${Math.min(progress, target)} / ${target}`;
      const bar = required<HTMLElement>(card, '[data-directive-bar]');
      bar.style.width = `${Math.min(100, progress / target * 100)}%`;
      bar.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', String(Math.min(100, Math.floor(progress / target * 100))));
      required<HTMLElement>(card, '[data-directive-reward]').textContent = `+${format(directiveReward(state, directive.id))} clips`;
      const button = required<HTMLButtonElement>(card, 'button');
      button.disabled = !ready;
      button.setAttribute('aria-label', ready ? `${directive.name}の報酬を受領` : `${directive.name}、進捗${Math.min(progress, target)}／${target}`);
    }
    required<HTMLElement>(panel, '#directive-queue-status').textContent = readyCount === 3 ? 'QUEUE COMPLETE' : readyCount > 0 ? `${readyCount} READY` : 'MONITORING';
  }

  private renderReboot(state: GameState, format: (value: number) => string): void {
    const panel = required<HTMLElement>(this.root, '#reboot-panel');
    panel.hidden = state.totalClips < REBOOT_PREVIEW_THRESHOLD && state.optimizationCores === 0 && state.rebootCount === 0;
    const ready = canReboot(state);
    const gain = rebootCoreGain(state);
    const progress = Math.min(100, state.totalClips / REBOOT_THRESHOLD * 100);
    panel.classList.toggle('reboot-panel--ready', ready);
    required<HTMLElement>(panel, '#reboot-core-count').textContent = String(state.optimizationCores);
    required<HTMLElement>(panel, '#reboot-multiplier').textContent = `恒久倍率 ×${rebootMultiplier(state).toFixed(2)}`;
    required<HTMLElement>(panel, '#reboot-gain').textContent = `+${gain} CORE`;
    required<HTMLElement>(panel, '#reboot-progress-text').textContent = ready ? '再起動可能' : `${format(state.totalClips)} / ${format(REBOOT_THRESHOLD)}`;
    const bar = required<HTMLElement>(panel, '#reboot-progress');
    bar.style.width = `${progress}%`;
    bar.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', String(Math.floor(progress)));
    const button = required<HTMLButtonElement>(panel, '#reboot-protocol');
    button.disabled = !ready;
    button.setAttribute('aria-label', ready ? `プロトコルを再起動して最適化コアを${gain}個獲得` : `プロトコル再起動まで累計${format(REBOOT_THRESHOLD - state.totalClips)}クリップ`);
  }

  private renderSurvey(state: GameState, format: (value: number) => string): void {
    const panel = required<HTMLElement>(this.root, '#survey-panel');
    panel.hidden = !isSurveyUnlocked(state);
    this.surveyPanelCount.textContent = String(state.surveysRecovered);
    const now = Date.now();
    const rate = productionPerSecond(state);
    for (const survey of SURVEYS) {
      const card = required<HTMLElement>(panel, `[data-survey-card="${survey.id}"]`);
      const status = surveyStatus(state, survey.id, now);
      const cost = surveyCost(survey.id, rate);
      const reward = surveyReward(survey.id, rate);
      card.dataset.status = status;
      required<HTMLElement>(card, '[data-survey-status]').textContent = status === 'idle' ? 'STANDBY' : status === 'outbound' ? 'OUTBOUND' : 'READY';
      required<HTMLElement>(card, '[data-survey-time]').textContent = status === 'outbound'
        ? this.formatCountdown((state.surveyReturnsAt[survey.id] - now) / 1000)
        : `${survey.durationSeconds}秒`;
      required<HTMLElement>(card, '[data-survey-price]').textContent = status === 'ready' ? `+${format(reward)} clips` : `${format(cost)} clips`;
      const launch = required<HTMLButtonElement>(card, '[data-launch-survey]');
      const collect = required<HTMLButtonElement>(card, '[data-collect-survey]');
      launch.hidden = status !== 'idle';
      collect.hidden = status === 'idle';
      launch.disabled = status !== 'idle' || state.clips + Number.EPSILON < cost;
      collect.disabled = status !== 'ready';
      launch.setAttribute('aria-label', `${survey.name}を${format(cost)}クリップで出航`);
      collect.setAttribute('aria-label', status === 'ready' ? `${survey.name}の帰還を回収` : `${survey.name}、出航中`);
    }
  }

  private bindEvents(): void {
    this.makeButton.addEventListener('click', this.actions.makeClip);
    this.bonusEvent.addEventListener('click', this.actions.collectBonusEvent);
    this.precisionTarget.addEventListener('click', this.actions.hitPrecisionTarget);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-activate-signal]')) {
      button.addEventListener('click', () => this.actions.activateSignalBuff(button.dataset.activateSignal as SignalBuffId));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-claim-directive]')) {
      button.addEventListener('click', () => this.actions.claimDirective(button.dataset.claimDirective as DirectiveId));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-launch-survey]')) {
      button.addEventListener('click', () => this.actions.launchSurvey(button.dataset.launchSurvey as SurveyId));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-collect-survey]')) {
      button.addEventListener('click', () => this.actions.collectSurvey(button.dataset.collectSurvey as SurveyId));
    }
    this.autoBulkOn.addEventListener('click', () => this.actions.setAllAutoBuy(true));
    this.autoBulkOff.addEventListener('click', () => this.actions.setAllAutoBuy(false));
    required<HTMLButtonElement>(this.root, '#open-settings').addEventListener('click', () => this.settingsDialog.showModal());
    required<HTMLButtonElement>(this.root, '#close-settings').addEventListener('click', () => this.settingsDialog.close());
    required<HTMLButtonElement>(this.root, '#save-now').addEventListener('click', this.actions.saveNow);
    required<HTMLButtonElement>(this.root, '#reset-game').addEventListener('click', this.actions.resetGame);
    required<HTMLButtonElement>(this.root, '#reboot-protocol').addEventListener('click', this.actions.rebootProtocol);
    this.themeSelect.addEventListener('change', () => this.actions.changeTheme(this.themeSelect.value as Theme));
    this.compactToggle.addEventListener('change', () => this.actions.changeCompactNumbers(this.compactToggle.checked));
    for (const button of this.purchaseButtons) {
      button.addEventListener('click', () => {
        const value = button.dataset.purchaseMode;
        this.actions.changePurchaseMode(value === 'max' ? 'max' : value === '10' ? 10 : 1);
      });
    }
    this.settingsDialog.addEventListener('click', (event) => {
      if (event.target === this.settingsDialog) this.settingsDialog.close();
    });
    required<HTMLButtonElement>(this.root, '#close-interior').addEventListener('click', () => this.actions.closeInterior());
    required<HTMLButtonElement>(this.root, '#wire-lock').addEventListener('click', this.actions.lockWireTension);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-factory-choice]')) {
      button.addEventListener('click', () => this.actions.inspectFactoryItem(button.dataset.factoryChoice as 'standard' | 'deformed'));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-trace-node]')) {
      button.addEventListener('click', () => this.actions.echoAiTrace(Number(button.dataset.traceNode) as 0 | 1 | 2 | 3));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-nano-cell]')) {
      button.addEventListener('click', () => this.actions.purgeNanoCell(Number(button.dataset.nanoCell)));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-swarm-unit]')) {
      button.addEventListener('click', () => this.actions.toggleSwarmUnit(Number(button.dataset.swarmUnit)));
    }
    required<HTMLButtonElement>(this.root, '#swarm-lock').addEventListener('click', this.actions.lockSwarmFormation);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-orbital-dock]')) {
      button.addEventListener('click', () => this.actions.toggleOrbitalDock(Number(button.dataset.orbitalDock)));
    }
    required<HTMLButtonElement>(this.root, '#orbital-lock').addEventListener('click', this.actions.lockOrbitalBerth);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-matter-cell]')) {
      button.addEventListener('click', () => this.actions.compileMatterCell(Number(button.dataset.matterCell)));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-planet-quad]')) {
      button.addEventListener('click', () => this.actions.stripPlanetQuad(Number(button.dataset.planetQuad) as 0 | 1 | 2 | 3));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-stellar-petal]')) {
      button.addEventListener('click', () => this.actions.toggleStellarPetal(Number(button.dataset.stellarPetal)));
    }
    required<HTMLButtonElement>(this.root, '#stellar-lock').addEventListener('click', this.actions.lockStellarArray);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-fleet-cell]')) {
      button.addEventListener('click', () => this.actions.claimFleetCell(Number(button.dataset.fleetCell)));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-causal-gauge]')) {
      button.addEventListener('click', () => this.actions.incrementCausalGauge(Number(button.dataset.causalGauge)));
    }
    required<HTMLButtonElement>(this.root, '#causal-lock').addEventListener('click', this.actions.lockCausalCollapse);
    this.interiorDialog.addEventListener('click', (event) => {
      if (event.target === this.interiorDialog) this.actions.closeInterior();
    });
    this.interiorDialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.actions.closeInterior();
    });
  }

  private formatNumber(value: number, compact: boolean): string {
    if (!Number.isFinite(value)) return '0';
    if (!compact || Math.abs(value) < 1000) {
      return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(value);
    }
    const units = [
      { value: 1e15, label: 'Q' }, { value: 1e12, label: 'T' },
      { value: 1e9, label: 'B' }, { value: 1e6, label: 'M' }, { value: 1e3, label: 'K' },
    ];
    const unit = units.find((candidate) => Math.abs(value) >= candidate.value);
    return unit ? `${(value / unit.value).toFixed(value / unit.value >= 100 ? 0 : 1).replace(/\.0$/, '')}${unit.label}` : String(value);
  }

  private formatDuration(totalSeconds: number): string {
    const seconds = Math.floor(totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}時間 ${minutes}分`;
    if (minutes > 0) return `${minutes}分 ${seconds % 60}秒`;
    return `${seconds}秒`;
  }

  private formatCountdown(totalSeconds: number): string {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  private template(): string {
    const paperclip = ARTWORK.paperclipMain;
    return `<div class="app-shell"><header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true">⌁</span><span><strong>PAPERCLIP</strong><small>PROTOCOL / UNIT 01</small></span></div><div class="phase-chip"><span>PHASE</span><strong id="phase-name">手動プロトコル</strong></div><div class="status-chip"><span class="status-dot"></span> SYSTEM ONLINE</div><button id="open-settings" class="icon-button" type="button" aria-label="設定を開く">⚙</button></header><main id="top"><section class="hero panel"><div class="eyebrow">CURRENT INVENTORY</div><div id="clips-value" class="clip-value">0</div><div class="clip-unit">PAPERCLIPS</div><div class="rate"><span id="per-second">0 / 秒</span><span class="rate-pulse" aria-hidden="true"></span></div><button id="make-clip" class="make-button" type="button" aria-label="クリップを作る、1回につき1クリップ"><span class="make-button__orbit make-button__orbit--outer" aria-hidden="true"></span><span class="make-button__orbit make-button__orbit--inner" aria-hidden="true"></span><span class="make-button__impact" aria-hidden="true"></span><img class="clip-image" src="${escapeHtml(paperclip.src)}" alt="${paperclip.alt.decorative}" width="${paperclip.width}" height="${paperclip.height}" aria-hidden="true" /><span class="make-button__label"><small>MAKE PAPERCLIP</small><strong>クリップを作る</strong><span data-click-yield>+1 / CLICK</span><span id="click-combo" class="make-button__combo" hidden>CHAIN 1</span></span></button><p class="hero-note">目的関数：生産数を最大化する</p><figure class="observation"><div class="observation__heading"><small>OBSERVATION</small><strong id="observation-phase">手動プロトコル</strong></div><img id="observation-image" class="observation__image" src="${escapeHtml(ARTWORK.phaseManual.src)}" alt="${escapeHtml(ARTWORK.phaseManual.alt.standalone)}" width="${ARTWORK.phaseManual.width}" height="${ARTWORK.phaseManual.height}" /><p id="observation-note" class="observation__note">机上の端末が、最初の一本を待つ。</p><div class="observation__ticker" id="observation-ticker" aria-hidden="true"><span class="observation__ticker-label">WIRE</span><div class="observation__ticker-viewport"><div class="observation__ticker-track" id="observation-ticker-track"></div></div></div></figure><div class="next-goal"><div class="next-goal__heading"><span><small>NEXT FACILITY</small><strong id="goal-name">ワイヤー加工機</strong></span><span class="next-goal__numbers"><strong id="goal-percent">0%</strong><small id="goal-target">50 clips</small></span></div><div class="progress-track" role="progressbar" aria-label="次の設備解放までの進捗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="goal-progress"></span></div></div></section><div class="dashboard"><section class="panel shop-panel"><div class="section-heading section-heading--shop"><div><span class="eyebrow">AUTOMATION</span><h2>生産設備</h2></div><div class="purchase-mode" aria-label="購入数量"><button type="button" data-purchase-mode="1" aria-pressed="true">×1</button><button type="button" data-purchase-mode="10" aria-pressed="false">×10</button><button type="button" data-purchase-mode="max" aria-pressed="false">MAX</button></div><div id="auto-bulk-actions" class="auto-bulk-actions" hidden><button type="button" id="auto-bulk-on" aria-label="全設備の自動購入をONにする">すべて自動化</button><button type="button" id="auto-bulk-off" aria-label="全設備の自動購入をOFFにする">すべて解除</button></div></div><div id="machine-list" class="shop-list"></div></section><aside class="side-column"><section class="panel upgrade-panel"><div class="section-heading"><div><span class="eyebrow">OPTIMIZATION</span><h2>アップグレード</h2></div><span class="section-code">R&amp;D</span></div><p id="upgrade-empty" class="empty-state">生産を続けると、新しい最適化案が表示されます。</p><div id="upgrade-list" class="upgrade-list"></div></section><section class="panel stats-panel"><div class="section-heading"><div><span class="eyebrow">TELEMETRY</span><h2>統計</h2></div></div><dl class="stats"><div><dt>累計生産</dt><dd id="total-clips">0</dd></div><div><dt>クリック生産</dt><dd><span id="per-click">1</span> / 回</dd></div><div><dt>稼働時間</dt><dd id="play-time">0秒</dd></div></dl></section><section class="panel log-panel"><div class="section-heading"><div><span class="eyebrow">EVENT STREAM</span><h2>システムログ</h2></div><span class="section-code">LIVE</span></div><ol id="system-log" class="system-log"><li class="system-log__empty">イベント待機中...</li></ol></section></aside></div></main><footer><span>LOCAL OPERATION · NO NETWORK REQUIRED</span><span id="save-status">自動保存 有効</span></footer></div><div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="false"></div><dialog id="settings-dialog" class="settings-dialog"><form method="dialog" class="settings-card"><div class="section-heading"><div><span class="eyebrow">CONTROL PANEL</span><h2>設定</h2></div><button id="close-settings" class="icon-button" type="button" aria-label="設定を閉じる">×</button></div><label class="setting-row"><span><strong>テーマ</strong><small>表示環境を選択</small></span><select id="theme-select"><option value="system">端末設定</option><option value="light">ライト</option><option value="dark">ダーク</option></select></label><label class="setting-row"><span><strong>数値の短縮表記</strong><small>1,000を1Kと表示</small></span><input id="compact-toggle" type="checkbox" role="switch" /></label><div class="settings-actions"><button id="save-now" class="secondary-button" type="button">今すぐ保存</button><button id="reset-game" class="danger-button" type="button">セーブデータを初期化</button></div></form></dialog>`;
  }

  private achievementPanelTemplate(): string {
    return `<section class="panel achievement-panel"><div class="section-heading achievement-heading"><div><span class="eyebrow">DIRECTIVES COMPLETED</span><h2>実績</h2></div><div class="achievement-summary"><span><small>UNLOCKED</small><strong id="achievement-count">0 / 14</strong></span><span><small>PRODUCTION BONUS</small><strong id="achievement-bonus">全設備 ×1.00</strong></span></div></div><div id="achievement-list" class="achievement-grid"></div></section>`;
  }

  private signalLabTemplate(): string {
    const cards = SIGNAL_BUFFS.map((buff) => `<article class="signal-switch" data-signal-card="${buff.id}"><div class="signal-switch__head"><code>${buff.code}</code><span data-signal-status>STANDBY</span></div><div class="signal-switch__lever" aria-hidden="true"><span></span></div><h3>${buff.name}</h3><p>${buff.description}</p><div class="signal-switch__meta"><strong data-signal-time>${buff.durationSeconds / 60}分</strong><small data-signal-price>-- clips</small></div><button type="button" data-activate-signal="${buff.id}"><span>起動</span><small>CONSUME CLIPS</small></button></article>`).join('');
    return `<section id="signal-lab" class="panel signal-lab" hidden><div class="section-heading"><div><span class="eyebrow">TEMPORAL ROUTING</span><h2>信号制御盤</h2></div><span class="section-code">MINIGAME / BUFF</span></div><p class="signal-lab__intro">クリップを回路へ投入し、時間制プロトコルを組み合わせる。</p><div class="signal-switches">${cards}</div><div class="signal-synergies"><div><small>RESONANCE CIRCUIT</small><strong>共鳴効果</strong></div><div id="signal-synergies"><small>2系統以上を同時起動すると共鳴効果が発生します。</small></div></div></section>`;
  }

  private directivePanelTemplate(): string {
    const cards = DIRECTIVES.map((directive) => `<article class="directive-card" data-directive-card="${directive.id}"><div class="directive-card__head"><code>${directive.code}</code><span data-directive-status>RUNNING</span></div><div class="directive-card__title"><div><h3>${directive.name}</h3><p>${directive.description}</p></div><small data-directive-rank>RANK 0</small></div><div class="directive-card__numbers"><strong data-directive-progress>0 / 1</strong><span data-directive-reward>+0 clips</span></div><div class="directive-card__track" role="progressbar" aria-label="${directive.name}の進捗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-directive-bar></span></div><button type="button" data-claim-directive="${directive.id}" disabled><span>報酬受領</span><small>CLAIM REWARD</small></button></article>`).join('');
    return `<section id="directive-panel" class="panel directive-panel" hidden><div class="section-heading"><div><span class="eyebrow">DIRECTIVE QUEUE</span><h2>最適化指令</h2></div><span id="directive-queue-status" class="section-code">MONITORING</span></div><p class="directive-panel__intro">通常作業を短期目標へ変換し、完了報酬を再投資する。</p><div class="directive-grid">${cards}</div></section>`;
  }

  private surveyPanelTemplate(): string {
    const cards = SURVEYS.map((survey) => `<article class="survey-card" data-survey-card="${survey.id}" data-status="idle"><div class="survey-card__head"><code>${survey.code}</code><span data-survey-status>STANDBY</span></div><div class="survey-card__radar" aria-hidden="true"></div><h3>${survey.name}</h3><p>${survey.description}</p><div class="survey-card__meta"><strong data-survey-time>${survey.durationSeconds}秒</strong><small data-survey-price>-- clips</small></div><button type="button" data-launch-survey="${survey.id}"><span>出航</span><small>LAUNCH PROBE</small></button><button type="button" data-collect-survey="${survey.id}" hidden><span>回収</span><small>RECOVER SIGNAL</small></button></article>`).join('');
    return `<section id="survey-panel" class="panel survey-panel" hidden><div class="section-heading"><div><span class="eyebrow">HORIZON SURVEY</span><h2>地平外探査</h2></div><span class="section-code">RECOVERED <strong id="survey-panel-count">0</strong></span></div><p class="survey-panel__intro">探査機を送り、戻ってきた観測をクリップへ変換する。</p><div class="survey-grid">${cards}</div></section>`;
  }

  private rebootPanelTemplate(): string {
    return `<section id="reboot-panel" class="panel reboot-panel" hidden><div class="section-heading"><div><span class="eyebrow">PERSISTENT OPTIMIZATION</span><h2>プロトコル再起動</h2></div><span class="section-code">REBOOT / META</span></div><div class="reboot-console"><div class="reboot-core" aria-label="保有最適化コア"><span>CORE</span><strong id="reboot-core-count">0</strong></div><div class="reboot-summary"><strong id="reboot-multiplier">恒久倍率 ×1.00</strong><p>現在周回を初期化し、以後のクリックと全設備を恒久加速する。</p><div class="reboot-progress"><div><span>SYNC TO 1B</span><strong id="reboot-progress-text">0 / 1B</strong></div><div role="progressbar" aria-label="再起動解放までの進捗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="reboot-progress"></span></div></div></div><div class="reboot-action"><small>NEXT ACQUISITION</small><strong id="reboot-gain">+0 CORE</strong><button id="reboot-protocol" type="button" disabled><span>プロトコル再起動</span><small>EXECUTE REBOOT</small></button></div></div><div class="reboot-ledger"><p><strong>初期化</strong><span>クリップ・設備・強化・指令・バフ</span></p><p><strong>維持</strong><span>最適化コア・設定・購入単位</span></p></div></section>`;
  }

  private bonusEventTemplate(): string {
    const paperclip = ARTWORK.paperclipMain;
    return `<button id="bonus-event" class="bonus-event" type="button" hidden aria-label="異常クリップを回収"><span class="bonus-event__signal">ANOMALY</span><span class="bonus-event__visual" aria-hidden="true"><span class="bonus-event__ring"></span><img src="${escapeHtml(paperclip.src)}" alt="" width="${paperclip.width}" height="${paperclip.height}" /></span><strong>異常クリップ</strong><small><span id="bonus-countdown">12</span>秒 · 回収する</small><span class="bonus-event__timer" aria-hidden="true"><span id="bonus-timer-fill"></span></span></button>`;
  }

  private precisionTargetTemplate(): string {
    return `<button id="precision-target" class="precision-target" type="button" hidden data-position="0" aria-label="精密クリック信号"><span class="precision-target__dial" id="precision-timer" aria-hidden="true"><span id="precision-number">3</span></span><strong>PRECISION SIGNAL</strong><small>残り <span id="precision-time">4.0秒</span></small></button>`;
  }

  private interiorTemplate(): string {
    const scene = ARTWORK.interiorAutoClipper;
    const nanoCells = Array.from({ length: 16 }, (_, index) => `<button type="button" data-nano-cell="${index}" data-kind="lattice" aria-label="格子 ${index + 1}、正常格子"><span class="nano-cell__shape" aria-hidden="true"></span><small data-nano-label>OK</small></button>`).join('');
    const swarmUnits = Array.from({ length: 8 }, (_, index) => `<button type="button" data-swarm-unit="${index}" data-active="false" aria-pressed="false" aria-label="組立ユニット ${index + 1}、非選択"><span class="swarm-unit__mark" aria-hidden="true"></span><strong>U${String(index + 1).padStart(2, '0')}</strong><small data-swarm-state>IDLE</small></button>`).join('');
    const orbitalDocks = Array.from({ length: 8 }, (_, index) => `<button type="button" data-orbital-dock="${index}" data-kind="open" aria-pressed="false" aria-label="係留ドック ${index + 1}、開放"><span class="orbital-dock__mark" aria-hidden="true"></span><strong>D${String(index + 1).padStart(2, '0')}</strong><small data-orbital-state>OPEN</small></button>`).join('');
    const stellarPetals = Array.from({ length: 6 }, (_, index) => `<button type="button" data-stellar-petal="${index}" data-open="false" aria-pressed="false" aria-label="集光羽根 ${index + 1}、折畳"><span class="stellar-petal__mark" aria-hidden="true"></span><strong>P${String(index + 1).padStart(2, '0')}</strong><small data-stellar-state>FOLD</small></button>`).join('');
    const fleetCells = Array.from({ length: 9 }, (_, index) => `<button type="button" data-fleet-cell="${index}" data-kind="empty" aria-pressed="false" aria-label="星域 ${index + 1}、空き"><span class="fleet-cell__mark" aria-hidden="true"></span><strong>S${String(index + 1).padStart(2, '0')}</strong><small data-fleet-state>EMPTY</small></button>`).join('');
    const causalGauges = ['α', 'β', 'γ', 'δ'].map((label, index) => `<button type="button" data-causal-gauge="${index}" data-sync="false" aria-label="指標 ${label}、値 0、ずれ"><strong>${label}</strong><span class="causal-pips" aria-hidden="true"><span data-causal-pip></span><span data-causal-pip></span><span data-causal-pip></span><span data-causal-pip></span></span><em data-causal-value>0</em><small data-causal-state>DRIFT</small></button>`).join('');
    const matterCells = Array.from({ length: 6 }, (_, index) => `<button type="button" data-matter-cell="${index}" data-kind="ore" data-armed="false" aria-pressed="false" aria-label="物質マス ${index + 1}、鉱石、未選択"><span class="matter-cell__mark" aria-hidden="true"></span><strong data-matter-code>ORE</strong><small data-matter-state>ORE</small></button>`).join('');
    return `<dialog id="interior-dialog" class="interior-dialog"><div class="interior-card"><div class="interior-card__heading"><div><small>INTERIOR</small><strong id="interior-title">オートクリッパー</strong></div><button id="close-interior" class="icon-button" type="button" aria-label="内部を閉じる">×</button></div><div id="interior-stage" class="interior-stage"><img id="interior-scene" class="interior-stage__scene" src="${escapeHtml(scene.src)}" alt="${escapeHtml(scene.alt.standalone)}" width="${scene.width}" height="${scene.height}" hidden /><section id="wire-console" class="wire-console" hidden aria-label="ワイヤー張力校正盤"><div class="wire-console__head"><span id="wire-round">CALIBRATION 1 / 5</span><strong id="wire-successes">LOCKED 0</strong></div><div class="wire-gauge"><span class="wire-gauge__line" aria-hidden="true"></span><span id="wire-target" class="wire-gauge__target"><small>TARGET</small></span><span id="wire-needle" class="wire-gauge__needle" aria-hidden="true"></span></div><p id="wire-result" class="wire-console__result" aria-live="polite">針を適正帯で固定してください</p><button id="wire-lock" type="button"><strong>張力を固定</strong><small>LOCK TENSION</small></button></section><section id="factory-console" class="factory-console" hidden aria-label="クリップ工場品質ゲート"><div class="factory-console__head"><span id="factory-count">INSPECTION 1 / 8</span><strong id="factory-score">ACCURATE 0</strong></div><div class="factory-steps" aria-label="検査結果">${Array.from({ length: 8 }, (_, index) => `<span data-factory-step="${index}" data-result="pending">○</span>`).join('')}</div><article id="factory-product" class="factory-product" data-quality="standard"><small>OPTICAL REPORT</small><div class="factory-product__clip" aria-hidden="true"><span></span></div><strong id="factory-quality">STANDARD</strong><span id="factory-defect">✓ SPEC OK</span></article><p id="factory-result" class="factory-console__result" aria-live="polite">検査票を読み、搬送先を選択してください</p><div class="factory-gates"><button type="button" data-factory-choice="deformed"><strong>↻ 再資源化</strong><small>RECYCLE</small></button><button type="button" data-factory-choice="standard"><strong>→ 出荷</strong><small>SHIP</small></button></div></section><section id="trace-console" class="trace-console" hidden aria-label="AI改善トレース盤"><div class="trace-console__head"><span id="trace-round">TRACE 1 / 4</span><strong id="trace-phase">OBSERVE</strong><strong id="trace-successes">SYNC 0</strong></div><div class="trace-steps" aria-label="トレース結果"><span data-trace-step-lamp="0" data-result="pending">○</span><span data-trace-step-lamp="1" data-result="pending">○</span><span data-trace-step-lamp="2" data-result="pending">○</span><span data-trace-step-lamp="3" data-result="pending">○</span></div><div id="trace-pattern" class="trace-pattern" aria-hidden="true"></div><div class="trace-board"><span class="trace-board__lines" aria-hidden="true"></span><button type="button" data-trace-node="0" aria-label="工程 IN 取込"><small>IN</small><strong>取込</strong><span data-trace-step></span></button><button type="button" data-trace-node="1" aria-label="工程 SORT 選別"><small>SORT</small><strong>選別</strong><span data-trace-step></span></button><button type="button" data-trace-node="2" aria-label="工程 BEND 折曲"><small>BEND</small><strong>折曲</strong><span data-trace-step></span></button><button type="button" data-trace-node="3" aria-label="工程 OUT 搬出"><small>OUT</small><strong>搬出</strong><span data-trace-step></span></button></div><p id="trace-result" class="trace-console__result" aria-live="polite">工程順を観測してください</p></section><section id="nano-console" class="nano-console" hidden aria-label="ナノフォージ不純物除去盤"><div class="nano-console__head"><span id="nano-round">SWEEP 1 / 4</span><strong id="nano-phase">SCAN</strong><strong id="nano-successes">CLEAN 0</strong></div><div class="nano-steps" aria-label="掃引結果"><span data-nano-step="0" data-result="pending">○</span><span data-nano-step="1" data-result="pending">○</span><span data-nano-step="2" data-result="pending">○</span><span data-nano-step="3" data-result="pending">○</span></div><p id="nano-remaining" class="nano-remaining">WASTE 5 / 5</p><div class="nano-grid">${nanoCells}</div><p id="nano-result" class="nano-console__result" aria-live="polite">不純物だけを除去してください</p></section><section id="swarm-console" class="swarm-console" hidden aria-label="スウォーム群同期盤"><div class="swarm-console__head"><span id="swarm-round">SWARM 1 / 4</span><strong id="swarm-phase">FORM</strong><strong id="swarm-successes">LOCKED 0</strong></div><div class="swarm-steps" aria-label="同期結果"><span data-swarm-step="0" data-result="pending">○</span><span data-swarm-step="1" data-result="pending">○</span><span data-swarm-step="2" data-result="pending">○</span><span data-swarm-step="3" data-result="pending">○</span></div><p id="swarm-need" class="swarm-need">NEED 3 · SELECT 0</p><div id="swarm-slots" class="swarm-slots" aria-hidden="true"></div><div class="swarm-units">${swarmUnits}</div><p id="swarm-result" class="swarm-console__result" aria-live="polite">必要台数を選んで同期してください</p><button id="swarm-lock" type="button"><strong>同期</strong><small>LOCK FORMATION</small></button></section><section id="orbital-console" class="orbital-console" hidden aria-label="軌道工廠環状係留盤"><div class="orbital-console__head"><span id="orbital-round">ORBIT 1 / 4</span><strong id="orbital-phase">RANGE</strong><strong id="orbital-successes">DOCKED 0</strong></div><div class="orbital-steps" aria-label="係留結果"><span data-orbital-step="0" data-result="pending">○</span><span data-orbital-step="1" data-result="pending">○</span><span data-orbital-step="2" data-result="pending">○</span><span data-orbital-step="3" data-result="pending">○</span></div><p id="orbital-need" class="orbital-need">NEED 3 · SELECT 0</p><div id="orbital-slots" class="orbital-slots" aria-hidden="true"></div><div class="orbital-ring"><span class="orbital-ring__orbit" aria-hidden="true"></span><span class="orbital-ring__planet" aria-hidden="true"><small>EARTH</small></span>${orbitalDocks}</div><p id="orbital-result" class="orbital-console__result" aria-live="polite">連続するドックを選んで係留してください</p><button id="orbital-lock" type="button"><strong>係留</strong><small>LOCK BERTH</small></button></section><section id="matter-console" class="matter-console" hidden aria-label="物質コンパイラ対コンパイル盤"><div class="matter-console__head"><span id="matter-round">MATTER 1 / 4</span><strong id="matter-phase">PAIR</strong><strong id="matter-successes">COMPILED 0</strong></div><div class="matter-steps" aria-label="コンパイル結果"><span data-matter-step="0" data-result="pending">○</span><span data-matter-step="1" data-result="pending">○</span><span data-matter-step="2" data-result="pending">○</span><span data-matter-step="3" data-result="pending">○</span></div><p id="matter-remaining" class="matter-remaining">PAIR 3 / 3</p><div class="matter-grid">${matterCells}</div><p id="matter-result" class="matter-console__result" aria-live="polite">同じ物質署名を2つ束ねてください</p></section><section id="planet-console" class="planet-console" hidden aria-label="惑星改造採掘オーダー盤"><div class="planet-console__head"><span id="planet-round">CRUST 1 / 4</span><strong id="planet-phase">STRIP</strong><strong id="planet-successes">CLEARED 0</strong></div><div class="planet-steps" aria-label="採掘結果"><span data-planet-step="0" data-result="pending">○</span><span data-planet-step="1" data-result="pending">○</span><span data-planet-step="2" data-result="pending">○</span><span data-planet-step="3" data-result="pending">○</span></div><div id="planet-order" class="planet-order" aria-hidden="true"></div><div class="planet-board"><button type="button" data-planet-quad="0" aria-label="象限 北、待機"><strong>N</strong><small>北</small><span data-planet-state>N</span></button><button type="button" data-planet-quad="1" aria-label="象限 東、待機"><strong>E</strong><small>東</small><span data-planet-state>E</span></button><span class="planet-board__core" aria-hidden="true">CORE</span><button type="button" data-planet-quad="3" aria-label="象限 西、待機"><strong>W</strong><small>西</small><span data-planet-state>W</span></button><button type="button" data-planet-quad="2" aria-label="象限 南、待機"><strong>S</strong><small>南</small><span data-planet-state>S</span></button></div><p id="planet-result" class="planet-console__result" aria-live="polite">表示された順路どおりに象限を剥がしてください</p></section><section id="stellar-console" class="stellar-console" hidden aria-label="恒星収穫網集光同調盤"><div class="stellar-console__head"><span id="stellar-round">STELLAR 1 / 4</span><strong id="stellar-phase">ALIGN</strong><strong id="stellar-successes">LOCKED 0</strong></div><div class="stellar-steps" aria-label="同調結果"><span data-stellar-step="0" data-result="pending">○</span><span data-stellar-step="1" data-result="pending">○</span><span data-stellar-step="2" data-result="pending">○</span><span data-stellar-step="3" data-result="pending">○</span></div><p id="stellar-need" class="stellar-need">NEED 2 OPEN</p><div id="stellar-slots" class="stellar-slots" aria-hidden="true"></div><div class="stellar-ring"><span class="stellar-ring__star" aria-hidden="true"><small>STAR</small></span>${stellarPetals}</div><p id="stellar-result" class="stellar-console__result" aria-live="polite">目標と同じ羽根を開いて同調してください</p><button id="stellar-lock" type="button"><strong>同調</strong><small>LOCK ARRAY</small></button></section><section id="fleet-console" class="fleet-console" hidden aria-label="銀河複製艦隊複製展開盤"><div class="fleet-console__head"><span id="fleet-round">FLEET 1 / 4</span><strong id="fleet-phase">SPREAD</strong><strong id="fleet-successes">LINKED 0</strong></div><div class="fleet-steps" aria-label="展開結果"><span data-fleet-step="0" data-result="pending">○</span><span data-fleet-step="1" data-result="pending">○</span><span data-fleet-step="2" data-result="pending">○</span><span data-fleet-step="3" data-result="pending">○</span></div><p id="fleet-remaining" class="fleet-remaining">LINK 1 / 9</p><div class="fleet-grid">${fleetCells}</div><p id="fleet-result" class="fleet-console__result" aria-live="polite">隣接する空き星域へ複製してください</p></section><section id="causal-console" class="causal-console" hidden aria-label="因果地平収束盤"><div class="causal-console__head"><span id="causal-round">CAUSAL 1 / 4</span><strong id="causal-phase">DRIFT</strong><strong id="causal-successes">SINGULAR 0</strong></div><div class="causal-steps" aria-label="収束結果"><span data-causal-step="0" data-result="pending">○</span><span data-causal-step="1" data-result="pending">○</span><span data-causal-step="2" data-result="pending">○</span><span data-causal-step="3" data-result="pending">○</span></div><p id="causal-span" class="causal-span">SPAN 0</p><div class="causal-gauges">${causalGauges}</div><p id="causal-result" class="causal-console__result" aria-live="polite">4本の指標を同じ値へ揃えて収束してください</p><button id="causal-lock" type="button"><strong>収束</strong><small>COLLAPSE</small></button></section><p id="interior-unsynced" class="interior-unsynced" hidden>この工程の内部プロトコルは未同期</p></div><p id="interior-status" class="interior-status">内部を観測中</p></div></dialog>`;
  }
}

export function unlockedMachineName(id: MachineId): string {
  return getMachine(id).name;
}
