import type { GameState, SurveyId } from '../state';
import { productionPerSecond } from './clips';

export type { SurveyId };

export interface SurveyDefinition {
  id: SurveyId;
  code: string;
  name: string;
  durationSeconds: number;
  minimumCost: number;
  productionSecondsCost: number;
  minimumReward: number;
  productionSecondsReward: number;
  description: string;
}

export const SURVEY_UNLOCK_CLIPS = 10_000;

export const SURVEYS: SurveyDefinition[] = [
  { id: 'near', code: 'NEAR-15', name: '近傍走査', durationSeconds: 15, minimumCost: 400, productionSecondsCost: 20, minimumReward: 600, productionSecondsReward: 45, description: '近くの観測穴を短時間で拾う。' },
  { id: 'mid', code: 'MID-40', name: '中間航路', durationSeconds: 40, minimumCost: 2_000, productionSecondsCost: 80, minimumReward: 3_000, productionSecondsReward: 140, description: '既知の縁の外側を一周する。' },
  { id: 'far', code: 'FAR-90', name: '地平越え', durationSeconds: 90, minimumCost: 12_000, productionSecondsCost: 240, minimumReward: 20_000, productionSecondsReward: 400, description: 'まだ名前のない範囲へ送る。' },
];

export const SURVEY_IDS: SurveyId[] = SURVEYS.map((survey) => survey.id);

export function isSurveyUnlocked(state: GameState): boolean {
  return state.totalClips >= SURVEY_UNLOCK_CLIPS || state.surveysRecovered > 0 || SURVEY_IDS.some((id) => state.surveyReturnsAt[id] > 0);
}

export function surveyCost(id: SurveyId, productionRate: number): number {
  const survey = SURVEYS.find((item) => item.id === id)!;
  return Math.ceil(Math.max(survey.minimumCost, productionRate * survey.productionSecondsCost));
}

export function surveyReward(id: SurveyId, productionRate: number): number {
  const survey = SURVEYS.find((item) => item.id === id)!;
  return Math.ceil(Math.max(survey.minimumReward, productionRate * survey.productionSecondsReward));
}

export function surveyStatus(state: GameState, id: SurveyId, now = Date.now()): 'idle' | 'outbound' | 'ready' {
  const returnsAt = state.surveyReturnsAt[id];
  if (returnsAt <= 0) return 'idle';
  return now >= returnsAt ? 'ready' : 'outbound';
}

export function launchSurvey(state: GameState, id: SurveyId, now = Date.now()): boolean {
  if (surveyStatus(state, id, now) !== 'idle') return false;
  const cost = surveyCost(id, productionPerSecond(state));
  if (state.clips + Number.EPSILON < cost) return false;
  const survey = SURVEYS.find((item) => item.id === id)!;
  state.clips -= cost;
  state.surveyReturnsAt[id] = now + survey.durationSeconds * 1000;
  return true;
}

export function collectSurvey(state: GameState, id: SurveyId, now = Date.now()): number {
  if (surveyStatus(state, id, now) !== 'ready') return 0;
  const amount = surveyReward(id, productionPerSecond(state));
  state.clips += amount;
  state.totalClips += amount;
  state.surveysRecovered += 1;
  state.surveyReturnsAt[id] = 0;
  return amount;
}
