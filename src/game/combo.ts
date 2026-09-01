export const COMBO_WINDOW_MS = 700;
export const COMBO_MAX = 12;
export const COMBO_BONUS = 0.15;

export function comboMultiplier(combo: number): number {
  const safe = Math.max(1, Math.min(COMBO_MAX, Math.floor(combo)));
  return 1 + (safe - 1) * COMBO_BONUS;
}

export function nextCombo(current: number, lastClickAt: number, now: number): number {
  if (current >= 1 && now - lastClickAt <= COMBO_WINDOW_MS) return Math.min(COMBO_MAX, Math.floor(current) + 1);
  return 1;
}

export function comboExpired(current: number, lastClickAt: number, now: number): boolean {
  return current > 0 && now - lastClickAt > COMBO_WINDOW_MS;
}
